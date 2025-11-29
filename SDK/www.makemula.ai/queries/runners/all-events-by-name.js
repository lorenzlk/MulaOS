const { executeQuery } = require('../utils/query-runner');
const fs = require('fs').promises;
const path = require('path');

/**
 * Run All Events By Name Analysis
 * @param {Object} options - Query options
 * @param {number} options.days_back - Number of days to look back (default: 30)
 * @param {boolean} options.use_cached - Use cached results instead of running new query (default: false)
 */
async function runAllEventsByName(options = {}) {
  const {
    days_back = 30,
    use_cached = false
  } = options;

  const queryName = 'all-events-by-name';
  
  console.log(`Running All Events By Name Analysis...`);
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
    
    console.log('\n=== All Events By Name (Last 30 Days) ===');
    console.log(`Total unique event types: ${data.length}`);
    console.log('');
    
    if (data.length === 0) {
      console.log('No events found for the specified time period.');
      return data;
    }
    
    // Display results in a formatted table
    console.log('Event Name\t\t\t\tEvent Count\tUnique Sessions\tUnique Hosts\tEarliest\t\tLatest');
    console.log('----------\t\t\t\t-----------\t---------------\t------------\t--------\t\t------');
    
    data.forEach(row => {
      const eventName = (row.event_name || 'N/A').substring(0, 35);
      const eventCount = row.event_count || '0';
      const uniqueSessions = row.unique_sessions || '0';
      const uniqueHosts = row.unique_hosts || '0';
      const earliest = (row.earliest_event || 'N/A').substring(0, 16);
      const latest = (row.latest_event || 'N/A').substring(0, 16);
      
      console.log(`${eventName}\t\t${eventCount}\t\t${uniqueSessions}\t\t\t${uniqueHosts}\t\t\t${earliest}\t${latest}`);
    });
    
    // Look specifically for next-page related events
    const nextPageEvents = data.filter(row => 
      row.event_name && (
        row.event_name.toLowerCase().includes('next') || 
        row.event_name.toLowerCase().includes('page') ||
        row.event_name === 'mula_next_page_click'
      )
    );
    
    if (nextPageEvents.length > 0) {
      console.log('\n=== Next Page Related Events ===');
      nextPageEvents.forEach(row => {
        console.log(`${row.event_name}: ${row.event_count} events`);
      });
    } else {
      console.log('\n=== No Next Page Related Events Found ===');
    }
    
    return data;
    
  } catch (error) {
    console.error('Error running All Events By Name Analysis:', error);
    throw error;
  }
}

module.exports = { runAllEventsByName };

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
All Events By Name Analysis

Usage: node all-events-by-name.js [options]

Options:
  --use-cached, --cached     Use cached results instead of running new query
  --days-back <number>       Number of days to look back (default: 30)
  --help, -h                 Show this help message

Examples:
  node all-events-by-name.js
  node all-events-by-name.js --use-cached
  node all-events-by-name.js --days-back 14
            `);
      process.exit(0);
    }
  }
  
  runAllEventsByName({ 
    days_back: daysBack, 
    use_cached: useCached
  })
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to run analysis:', error);
      process.exit(1);
    });
}
