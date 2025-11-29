const { createLogger } = require('../helpers/LoggingHelpers');
const { sendSlackMessage } = require('../helpers/SlackHelpers');
const { executeQuery } = require('../queries/utils/query-runner');
const Bull = require('bull');

const logger = createLogger('ProductPerformanceWorker');

// Redis connection
const redisUrl = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';
const productPerformanceQueue = new Bull('productPerformanceQueue', redisUrl);

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
    const row = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row);
  }
  
  return data;
}

/**
 * Fetch product title from CDN using search_id and product_id
 */
async function fetchProductTitle(searchId, productId) {
  try {
    const cdnUrl = `https://cdn.makemula.ai/searches/${searchId}/results.json`;
    const response = await fetch(cdnUrl);
    
    if (!response.ok) {
      logger.warn('Failed to fetch product data from CDN', { 
        searchId, 
        productId, 
        status: response.status 
      });
      return null;
    }
    
    const data = await response.json();
    const products = data.shopping_results || [];
    
    // Find the product by product_id
    const product = products.find(p => p.product_id === productId);
    return product ? product.title : null;
    
  } catch (error) {
    logger.error('Error fetching product title from CDN', error, { 
      searchId, 
      productId 
    });
    return null;
  }
}

/**
 * Process product performance query and send to Slack
 * @param {number} days - Number of days to look back (default: 1)
 * @param {string|null} domain - Optional domain to filter by (null = network-wide)
 */
async function processProductPerformance(days = 1, domain = null) {
  try {
    logger.info('Starting product performance analysis', { days, domain });
    
    // Build query parameters
    // Note: Query runner does simple string replacement, so we need to handle null domain
    const queryParams = { days_back: days };
    if (domain) {
      queryParams.domain = domain;
    } else {
      // Use empty string to make the SQL condition match all (since NULL won't work with string replacement)
      queryParams.domain = '';
    }
    
    // Run the query
    const queryResult = await executeQuery('product-performance', { 
      parameters: queryParams,
      output_location: 's3://prod.makemula.ai/athena-results/product-performance/'
    });
    
    logger.info('Query completed, downloading results', { 
      queryExecutionId: queryResult.queryExecutionId,
      dataScanned: queryResult.dataScanned,
      executionTime: queryResult.executionTime
    });
    
    // Parse the downloaded CSV results
    const fs = require('fs').promises;
    const path = require('path');
    
    // Extract timestamp from the output location
    const timestamp = queryResult.outputLocation.split('/').slice(-2, -1)[0];
    const localFilePath = path.join(__dirname, '..', 'data', 'athena-results', 'product-performance', timestamp, `${queryResult.queryExecutionId}.csv`);
    
    logger.info('Reading local CSV file', { filePath: localFilePath });
    
    // Read and parse CSV content
    const csvContent = await fs.readFile(localFilePath, 'utf8');
    const rows = parseCSV(csvContent);
    
    if (!rows || rows.length === 0) {
      logger.info('No product performance data found', { days, domain });
      const domainText = domain ? ` for ${domain}` : '';
      await sendSlackMessage(
        process.env.SLACK_REPORTS_CHANNEL,
        `Product Performance Report (${days} day${days > 1 ? 's' : ''})${domainText}`,
        [{
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:information_source: No product performance data found${domainText} for the past ${days} day${days > 1 ? 's' : ''}.`
          }
        }]
      );
      return;
    }
    
    logger.info('CSV parsed successfully', { 
      rowCount: rows.length
    });
    
    // Fetch product titles from CDN
    const productsWithTitles = [];
    for (const row of rows) {
      const { product_id, search_id, view_count, click_count, total_engagement } = row;
      
      let title = null;
      if (search_id) {
        title = await fetchProductTitle(search_id, product_id);
      }
      
      productsWithTitles.push({
        product_id,
        search_id,
        title: title || `Product ${product_id}`,
        view_count: parseInt(view_count),
        click_count: parseInt(click_count),
        total_engagement: parseInt(total_engagement)
      });
    }
    
    // Generate Slack message blocks
    const domainText = domain ? ` - ${domain}` : ' (Network-Wide)';
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `Product Performance Report (${days} day${days > 1 ? 's' : ''})${domainText}`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Top ${Math.min(productsWithTitles.length, 10)} Products by Engagement*\n` +
                `Data scanned: ${queryResult.dataScanned}\n` +
                `Execution time: ${queryResult.executionTime}ms`
        }
      }
    ];
    
    // Add top products
    const topProducts = productsWithTitles.slice(0, 10);
    topProducts.forEach((product, index) => {
      const engagementText = product.total_engagement > 0 ? 
        `*${product.total_engagement} total* (${product.view_count} views, ${product.click_count} clicks)` : 
        'No engagement';
      
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${index + 1}. ${product.title}*\n` +
                `ID: \`${product.product_id}\`\n` +
                `Engagement: ${engagementText}`
        }
      });
    });
    
    // Add summary footer
    const totalViews = productsWithTitles.reduce((sum, p) => sum + p.view_count, 0);
    const totalClicks = productsWithTitles.reduce((sum, p) => sum + p.click_count, 0);
    const avgEngagement = productsWithTitles.length > 0 ? 
      (totalViews + totalClicks) / productsWithTitles.length : 0;
    
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `📊 *Summary:* ${totalViews} total views, ${totalClicks} total clicks, ${avgEngagement.toFixed(1)} avg engagement per product`
        }
      ]
    });
    
    // Send to Slack
    const reportTitle = `Product Performance Report (${days} day${days > 1 ? 's' : ''})${domainText}`;
    await sendSlackMessage(
      process.env.SLACK_REPORTS_CHANNEL,
      reportTitle,
      blocks
    );
    
    logger.info('Product performance report sent to Slack', { 
      days,
      domain,
      productCount: productsWithTitles.length,
      totalViews,
      totalClicks
    });
    
  } catch (error) {
    logger.error('Error processing product performance', error, { days });
    
    // Send error notification to Slack
    const domainText = domain ? `\nDomain: ${domain}` : '';
    await sendSlackMessage(
      process.env.SLACK_REPORTS_CHANNEL,
      `Product Performance Report Error`,
      [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:warning: *Error generating product performance report*\n` +
                `Days: ${days}${domainText}\n` +
                `Error: ${error.message}`
        }
      }]
    );
    
    throw error;
  }
}

module.exports = {
  productPerformanceQueue,
  processProductPerformance
}; 