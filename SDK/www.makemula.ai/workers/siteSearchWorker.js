const { executeQuery } = require('../queries/utils/query-runner');
const { Search } = require('../models');
const { Op } = require('sequelize');
const { sendSlackMessage } = require('../helpers/SlackHelpers');
const fs = require('fs').promises;
const path = require('path');

/**
 * Process site search traffic analysis
 * @param {Object} job - Job data containing domain, lookbackDays, channelId
 */
async function processSiteSearch({ domain, lookbackDays, channelId }) {
  try {
    console.log(`Processing site search for ${domain} (${lookbackDays} days)`);
    
    // Step 1: Get search traffic data from Athena
    const trafficQueryResult = await executeQuery('site-search-complete', {
      parameters: {
        domain: domain,
        days_back: lookbackDays
      },
      output_location: 's3://prod.makemula.ai/athena-results/site-search-complete/'
    });
    
    if (!trafficQueryResult || !trafficQueryResult.outputLocation) {
      throw new Error('No output location returned from traffic query');
    }
    
    // Step 2: Get all URLs data from Athena (single query for all search_ids)
    const urlsQueryResult = await executeQuery('site-search-all-urls', {
      parameters: {
        domain: domain,
        days_back: lookbackDays
      },
      output_location: 's3://prod.makemula.ai/athena-results/site-search-all-urls/'
    });
    
    if (!urlsQueryResult || !urlsQueryResult.outputLocation) {
      throw new Error('No output location returned from URLs query');
    }
    
    // Parse both CSV results
    const [trafficResult, allUrlsResult] = await Promise.all([
      parseQueryResults(trafficQueryResult, 'site-search-complete'),
      parseQueryResults(urlsQueryResult, 'site-search-all-urls')
    ]);
    
    if (!trafficResult || trafficResult.length === 0) {
      await sendSlackMessage(channelId, `🔍 *Search Traffic Analysis for ${domain} (${lookbackDays} days)*\n\n❌ No search traffic found for this domain in the specified time period.`);
      return;
    }
    
    // Step 3: Get search phrases from PostgreSQL
    const searchIds = trafficResult.map(row => row.search_id);
    const phraseMap = await getSearchPhrases(searchIds);
    
    // Step 4: Process data in JavaScript (no more queries needed)
    console.log(`Processing ${trafficResult.length} search phrases and ${allUrlsResult.length} URL records...`);
    
    // Group URLs by search_id and get top 3 for each
    const urlsBySearchId = {};
    allUrlsResult.forEach(urlRow => {
      const searchId = urlRow.search_id;
      if (!urlsBySearchId[searchId]) {
        urlsBySearchId[searchId] = [];
      }
      urlsBySearchId[searchId].push({
        page_url: urlRow.page_url,
        url_views: parseInt(String(urlRow.url_views).replace(/[^0-9]/g, '')) || 0
      });
    });
    
    // Sort URLs by view count and take top 3 for each search_id
    Object.keys(urlsBySearchId).forEach(searchId => {
      urlsBySearchId[searchId].sort((a, b) => b.url_views - a.url_views);
      urlsBySearchId[searchId] = urlsBySearchId[searchId].slice(0, 3);
    });
    
    // Combine traffic data with URLs
    const enrichedData = trafficResult.map(row => {
      // Ensure widget_views is properly converted to a number
      const widgetViews = parseInt(String(row.widget_views).replace(/[^0-9]/g, '')) || 0;
      
      return {
        search_id: row.search_id,
        phrase: phraseMap[row.search_id]?.phrase || 'Unknown Search',
        platform: phraseMap[row.search_id]?.platform || 'unknown',
        widget_views: widgetViews,
        top_urls: urlsBySearchId[row.search_id] || []
      };
    });
    
    // Step 4: Format and send Slack response
    const message = formatSlackResponse(domain, lookbackDays, enrichedData);
    await sendSlackMessage(channelId, message.text);
    
  } catch (error) {
    console.error('Error processing site search:', error);
    await sendSlackMessage(channelId, `❌ Error processing site search for ${domain}: ${error.message}`);
  }
}

/**
 * Get search phrases from PostgreSQL for given search IDs
 * @param {Array} searchIds - Array of search IDs to look up
 * @returns {Object} Map of search_id to phrase data
 */
async function getSearchPhrases(searchIds) {
  const searches = await Search.findAll({
    where: {
      phraseID: {
        [Op.in]: searchIds
      }
    },
    attributes: ['phraseID', 'phrase', 'platform']
  });
  
  const phraseMap = {};
  searches.forEach(search => {
    phraseMap[search.phraseID] = {
      phrase: search.phrase,
      platform: search.platform
    };
  });
  
  return phraseMap;
}

/**
 * Format Slack response with search traffic data
 * @param {string} domain - Domain being analyzed
 * @param {number} lookbackDays - Number of days analyzed
 * @param {Array} data - Enriched search traffic data
 * @returns {Object} Formatted Slack message
 */
function formatSlackResponse(domain, lookbackDays, data) {
  const totalViews = data.reduce((sum, item) => sum + item.widget_views, 0);
  const totalSearches = data.length;
  
  let message = `🔍 *Search Traffic Analysis for ${domain} (${lookbackDays} days)*\n\n`;
  message += `📊 *Top Search Phrases by Traffic:*\n\n`;
  
  data.forEach((item, index) => {
    message += `${index + 1}. *"${item.phrase}"* - ${item.widget_views.toLocaleString()} widget views\n`;
    message += `   🏷️ Platform: ${item.platform}\n`;
    
    if (item.top_urls && item.top_urls.length > 0) {
      message += `   🏆 Top URLs:\n`;
      item.top_urls.forEach((url, urlIndex) => {
        const clickableUrl = `https://${domain}${url.page_url}`;
        message += `   • <${clickableUrl}|${url.page_url}> (${url.url_views} views)\n`;
      });
    } else {
      message += `   • No URL data available\n`;
    }
    message += `\n`;
  });
  
  message += `📈 *Summary:*\n`;
  message += `• Total search phrases: ${totalSearches}\n`;
  message += `• Total widget views: ${totalViews.toLocaleString()}\n`;
  message += `• Most active: *"${data[0]?.phrase || 'N/A'}"*\n`;
  message += `• Date range: ${getDateRange(lookbackDays)}\n`;
  
  return { text: message };
}

/**
 * Get date range string for lookback period
 * @param {number} days - Number of days to look back
 * @returns {string} Formatted date range
 */
function getDateRange(days) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

/**
 * Parse CSV content into array of objects
 * @param {string} csvContent - Raw CSV content
 * @returns {Array} - Parsed data
 */
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
  }
  
  return data;
}

/**
 * Parse query results from downloaded CSV file
 * @param {Object} queryResult - Query execution result
 * @param {string} queryName - Name of the query for file path
 * @returns {Array} - Parsed results
 */
async function parseQueryResults(queryResult, queryName) {
  try {
    // Extract timestamp from output location
    const timestamp = queryResult.outputLocation.split('/').slice(-2, -1)[0];
    const localFilePath = path.join(__dirname, '..', 'data', 'athena-results', queryName, timestamp, `${queryResult.queryExecutionId}.csv`);
    
    console.log(`📁 Reading CSV from local file: ${localFilePath}`);
    
    // Read and parse CSV content
    const csvContent = await fs.readFile(localFilePath, 'utf8');
    const data = parseCSV(csvContent);
    
    console.log(`✅ Parsed ${data.length} rows from ${queryName} query`);
    return data;
  } catch (error) {
    console.error(`Error parsing query results for ${queryName}:`, error);
    return [];
  }
}



module.exports = { processSiteSearch };
