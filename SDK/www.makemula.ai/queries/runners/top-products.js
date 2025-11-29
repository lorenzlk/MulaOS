const { executeQuery } = require('../utils/query-runner');
const { uploadJsonToS3 } = require('../../helpers/S3Helpers');
const { createLogger } = require('../../helpers/LoggingHelpers');
const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');

const logger = createLogger('top-products-runner');

/**
 * Generates top-products.json files for each host based on store click data
 * @param {Object} options - Execution options
 * @param {number} options.daysBack - Number of days to look back (default: 30)
 * @param {boolean} options.useCached - Use cached results if available
 */
async function generateTopProducts(options = {}) {
  const { daysBack = 30, useCached = false } = options;
  
  try {
    logger.info('Starting top products generation', { daysBack, useCached });
    
    // Execute the query
    const result = await executeQuery('top-products', {
      parameters: { days_back: daysBack },
      useCached
    });
    
    // Parse the downloaded CSV file
    // The CSV is downloaded to data/athena-results/top-products/{timestamp}/{queryExecutionId}.csv
    // We need to find the most recent timestamp directory
    const topProductsDir = path.join(__dirname, '..', '..', 'data', 'athena-results', 'top-products');
    const timestampDirs = await fs.readdir(topProductsDir);
    const latestTimestamp = timestampDirs.sort().pop(); // Get the most recent timestamp
    const csvPath = path.join(topProductsDir, latestTimestamp, `${result.queryExecutionId}.csv`);
    
    if (!await fs.access(csvPath).then(() => true).catch(() => false)) {
      logger.warn('CSV file not found after query execution', { csvPath });
      return;
    }
    
    const data = [];
    const csvContent = await fs.readFile(csvPath, 'utf8');
    const lines = csvContent.split('\n').slice(1); // Skip header
    
    for (const line of lines) {
      if (line.trim()) {
        const [host, productId, clickCount] = line.split(',').map(field => field.replace(/"/g, ''));
        if (host && productId && clickCount) {
          data.push({ host, product_id: productId, click_count: parseInt(clickCount) });
        }
      }
    }
    
    if (data.length === 0) {
      logger.warn('No data found in CSV file');
      return;
    }
    
    logger.info('Parsed CSV data', { rowCount: data.length });
    
    // Group results by host
    const hostGroups = {};
    for (const row of data) {
      const host = row.host;
      const productId = row.product_id;
      
      if (!hostGroups[host]) {
        hostGroups[host] = [];
      }
      
      hostGroups[host].push(productId);
    }
    
    logger.info('Grouped products by host', { 
      totalHosts: Object.keys(hostGroups).length,
      totalProducts: Object.values(hostGroups).reduce((sum, products) => sum + products.length, 0)
    });
    
    // Upload top-products.json for each host
    const uploadPromises = Object.entries(hostGroups).map(async ([host, productIds]) => {
      try {
        // Upload to the CDN bucket with the correct path
        const cdnUrl = `https://cdn.makemula.ai/${host}/top-products.json`;
        const s3Key = `${host}/top-products.json`;
        
        // Upload with 5-minute TTL to the CDN bucket (same as manifest)
        const uploadResult = await uploadJsonToS3(cdnUrl, productIds, { 
          ttlMinutes: 5,
          bucket: 'prod.makemula.ai'
        });
        
        logger.info('Uploaded top-products.json', { 
          host, 
          productCount: productIds.length,
          url: cdnUrl 
        });
        
        return { host, success: true, productCount: productIds.length };
      } catch (error) {
        logger.error('Failed to upload top-products.json', error, { host });
        return { host, success: false, error: error.message };
      }
    });
    
    const uploadResults = await Promise.all(uploadPromises);
    
    // Log summary
    const successful = uploadResults.filter(r => r.success);
    const failed = uploadResults.filter(r => !r.success);
    
    logger.info('Top products generation completed', {
      successful: successful.length,
      failed: failed.length,
      totalProducts: successful.reduce((sum, r) => sum + r.productCount, 0)
    });
    
    if (failed.length > 0) {
      logger.warn('Some uploads failed', { failed: failed.map(f => f.host) });
    }
    
    return {
      successful: successful.length,
      failed: failed.length,
      totalProducts: successful.reduce((sum, r) => sum + r.productCount, 0),
      results: uploadResults
    };
    
  } catch (error) {
    logger.error('Failed to generate top products', error);
    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--days-back' && args[i + 1]) {
      options.daysBack = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--use-cached') {
      options.useCached = true;
    }
  }
  
  generateTopProducts(options)
    .then(result => {
      console.log('Top products generation completed successfully');
      console.log('Summary:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Top products generation failed:', error);
      process.exit(1);
    });
}

module.exports = { generateTopProducts }; 