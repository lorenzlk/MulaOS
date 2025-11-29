const { executeQuery } = require('../utils/query-runner');
const fs = require('fs').promises;
const path = require('path');

/**
 * Run Next Page CTR Analysis for on3.com
 * @param {Object} options - Query options
 * @param {number} options.days_back - Number of days to look back (default: 30)
 * @param {boolean} options.use_cached - Use cached results instead of running new query (default: false)
 */
async function runNextPageCTROn3(options = {}) {
  const {
    days_back = 30,
    use_cached = false
  } = options;

  const queryName = 'next-page-ctr-on3';
  
  console.log(`Running Next Page CTR Analysis for on3.com...`);
  console.log(`Days back: ${days_back}`);
  console.log(`Use cached results: ${use_cached}`);
  
  try {
    let csvPath;
    
    if (use_cached) {
      // Find the most recent cached results
      const resultsDir = path.join(__dirname, '..', '..', 'data', 'athena-results', queryName);
      const timestampDirs = await fs.readdir(resultsDir);
      const latestTimestamp = timestampDirs.sort().pop(); // Get the most recent timestamp directory
      
      if (!latestTimestamp) {
        throw new Error('No cached results found. Run without --use-cached to generate new results.');
      }
      
      const latestDir = path.join(resultsDir, latestTimestamp);
      const files = await fs.readdir(latestDir);
      const csvFile = files.find(file => file.endsWith('.csv'));
      
      if (!csvFile) {
        throw new Error('No CSV file found in latest results directory.');
      }
      
      csvPath = path.join(latestDir, csvFile);
      console.log(`Using cached results from: ${csvPath}`);
    } else {
      const executionResult = await executeQuery(queryName, {
        parameters: {
          days_back
        }
      });
      
      // Find the most recent CSV results file
      const resultsDir = path.join(__dirname, '..', '..', 'data', 'athena-results', queryName);
      const timestampDirs = await fs.readdir(resultsDir);
      const latestTimestamp = timestampDirs.sort().pop(); // Get the most recent timestamp directory
      
      if (!latestTimestamp) {
        throw new Error('No results found after query execution.');
      }
      
      const latestDir = path.join(resultsDir, latestTimestamp);
      const files = await fs.readdir(latestDir);
      const csvFile = files.find(file => file.endsWith('.csv'));
      
      if (!csvFile) {
        throw new Error('No CSV file found in results directory.');
      }
      
      csvPath = path.join(latestDir, csvFile);
      console.log(`Results saved to: ${csvPath}`);
    }
    
    // Read and parse CSV results
    const csvContent = await fs.readFile(csvPath, 'utf8');
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    const data = lines.slice(1).map(line => {
      const values = line.split(',');
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      return row;
    });
    
    console.log('\n=== Next Page CTR Analysis for on3.com ===');
    console.log(`Analysis Period: ${days_back} days`);
    console.log(`Scope: www.on3.com only`);
    console.log('');
    
    if (data.length === 0) {
      console.log('No data found for the specified time period.');
      return data;
    }
    
    const result = data[0];
    console.log(`Total Sessions: ${result.total_sessions || '0'}`);
    console.log(`Total Mula In-View Events: ${result.total_in_views || '0'}`);
    console.log(`Total Next Page Clicks: ${result.total_next_page_clicks || '0'}`);
    console.log(`Sessions with In-View Events: ${result.sessions_with_in_views || '0'}`);
    console.log(`Sessions with Next Page Clicks: ${result.sessions_with_next_page_clicks || '0'}`);
    console.log('');
    console.log(`Next Page CTR: ${result.next_page_ctr_percent || '0'}%`);
    console.log(`Session Conversion Rate: ${result.session_conversion_rate_percent || '0'}%`);
    console.log(`Average Clicks per Session: ${result.avg_clicks_per_session || '0'}`);
    
    // Calculate additional metrics
    const totalSessions = parseInt(result.total_sessions) || 0;
    const totalInViews = parseInt(result.total_in_views) || 0;
    const totalNextPageClicks = parseInt(result.total_next_page_clicks) || 0;
    const sessionsWithInViews = parseInt(result.sessions_with_in_views) || 0;
    const sessionsWithNextPageClicks = parseInt(result.sessions_with_next_page_clicks) || 0;
    
    console.log('\n=== Additional Insights ===');
    if (sessionsWithInViews > 0) {
      const avgInViewsPerSession = (totalInViews / sessionsWithInViews).toFixed(2);
      console.log(`Average In-View Events per Session: ${avgInViewsPerSession}`);
    }
    
    if (sessionsWithNextPageClicks > 0) {
      const avgClicksPerClickingSession = (totalNextPageClicks / sessionsWithNextPageClicks).toFixed(2);
      console.log(`Average Next Page Clicks per Clicking Session: ${avgClicksPerClickingSession}`);
    }
    
    const engagementRate = sessionsWithInViews > 0 ? ((sessionsWithNextPageClicks / sessionsWithInViews) * 100).toFixed(2) : 0;
    console.log(`Engagement Rate (Sessions with Clicks / Sessions with Views): ${engagementRate}%`);
    
    return data;
    
  } catch (error) {
    console.error('Error running Next Page CTR Analysis:', error);
    throw error;
  }
}

module.exports = { runNextPageCTROn3 };

// Allow running directly from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  let daysBack = 30;
  let useCached = false;
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--use-cached' || arg === '--cached') {
      useCached = true;
    } else if (arg === '--days-back' && i + 1 < args.length) {
      daysBack = parseInt(args[i + 1]);
      i++; // Skip next argument
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Next Page CTR Analysis for on3.com

Usage: node next-page-ctr-on3.js [options]

Options:
  --use-cached, --cached     Use cached results instead of running new query
  --days-back <number>       Number of days to look back (default: 30)
  --help, -h                 Show this help message

Examples:
  node next-page-ctr-on3.js
  node next-page-ctr-on3.js --use-cached
  node next-page-ctr-on3.js --days-back 14
            `);
      process.exit(0);
    }
  }
  
  runNextPageCTROn3({ 
    days_back: daysBack, 
    use_cached: useCached
  })
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to run analysis:', error);
      process.exit(1);
    });
}
