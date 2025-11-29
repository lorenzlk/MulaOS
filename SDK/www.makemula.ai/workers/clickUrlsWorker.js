require('dotenv').config();
const { executeQuery } = require('../queries/utils/query-runner');
const { sendSlackMessage } = require('../helpers/SlackHelpers.js');
const path = require('path');
const csv = require('csv-parser');
const fs = require('fs');

/**
 * Generate click URLs report showing top URLs with store clicks
 * @param {Object} job - Bull job object
 * @param {string} job.data.domain - Domain to analyze
 * @param {number} job.data.lookbackDays - Number of days to look back
 * @param {string} job.data.channelId - Slack channel ID to send results to
 * @param {string} job.data.channelName - Slack channel name for display
 */
async function generateClickUrlsReport(job) {
  const { domain, lookbackDays, channelId, channelName } = job.data;
  
  console.log('🚀 Starting click URLs report generation:', {
    domain,
    lookbackDays,
    channelId,
    channelName
  });

  try {
    // Execute the click URLs query
    console.log('📊 Executing click URLs query...');
    const result = await executeQuery('click-urls', {
      parameters: {
        domain: domain,
        days_back: lookbackDays
      }
    });

    if (!result || !result.outputLocation) {
      throw new Error('No output location returned from query');
    }

    console.log('✅ Query completed, processing results...');
    
    // Extract timestamp from output location and construct local file path
    const timestamp = result.outputLocation.split('/').slice(-2, -1)[0];
    const localFilePath = path.join(__dirname, '..', 'data', 'athena-results', 'click-urls', timestamp, `${result.queryExecutionId}.csv`);
    
    console.log('📁 Reading CSV from local file:', localFilePath);
    
    // Parse the CSV results using csv-parser
    const data = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(localFilePath)
        .pipe(csv())
        .on('data', (row) => {
          data.push(row);
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    console.log(`📈 Found ${data.length} URLs with store clicks`);
    console.log('Sample parsed data:', data.slice(0, 3)); // Debug: show first 3 rows

    if (data.length === 0) {
      const message = `📊 *Click URLs Report for ${domain}* (${lookbackDays} ${lookbackDays === 1 ? 'day' : 'days'})\n\n❌ No store clicks found for this domain in the specified time period.`;
      
      await sendSlackMessage(channelId, message);
      return;
    }

    // Format the results for Slack
    const daysText = lookbackDays === 1 ? '1 day' : `${lookbackDays} days`;
    let message = `📊 *Top URLs with Store Clicks - ${domain}* (${daysText})\n\n`;
    
    // Add top 20 URLs
    data.slice(0, 20).forEach((row, index) => {
      const pageUrl = row.page_url || 'N/A';
      const clickCount = row.click_count || '0';
      const searchId = row.search_id || 'N/A';
      
      // Create full clickable URL
      const fullUrl = pageUrl !== 'N/A' ? `https://${domain}${pageUrl}` : 'N/A';
      
      message += `${index + 1}. <${fullUrl}|${pageUrl}>\n`;
      message += `   • Clicks: *${clickCount}*\n`;
      message += `   • Search ID: \`${searchId}\`\n\n`;
    });

    if (data.length > 20) {
      message += `... and ${data.length - 20} more URLs\n\n`;
    }

    // Add summary stats
    const totalClicks = data.reduce((sum, row) => sum + parseInt(row.click_count || 0), 0);
    const uniqueUrls = data.length;
    
    message += `📈 *Summary:*\n`;
    message += `• Total URLs with clicks: ${uniqueUrls}\n`;
    message += `• Total store clicks: ${totalClicks}\n`;
    message += `• Average clicks per URL: ${Math.round(totalClicks / uniqueUrls)}\n`;

    console.log('📤 Sending results to Slack...');
    await sendSlackMessage(channelId, message);
    
    console.log('✅ Click URLs report sent successfully');

  } catch (error) {
    console.error('❌ Error generating click URLs report:', error);
    
    const errorMessage = `❌ *Error generating click URLs report for ${domain}*\n\n${error.message}`;
    await sendSlackMessage(channelId, errorMessage);
  }
}

module.exports = { generateClickUrlsReport };
