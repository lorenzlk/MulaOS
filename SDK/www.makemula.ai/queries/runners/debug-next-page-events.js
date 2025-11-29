const { executeQuery } = require('../utils/query-runner');
const fs = require('fs').promises;
const path = require('path');

async function runDebugNextPageEvents() {
  const queryName = 'debug-next-page-events';
  
  console.log('Running Debug Next Page Events...');
  
  try {
    const executionResult = await executeQuery(queryName, {});
    
    // Find the most recent CSV results file
    const resultsDir = path.join(__dirname, '..', '..', 'data', 'athena-results', queryName);
    const timestampDirs = await fs.readdir(resultsDir);
    const latestTimestamp = timestampDirs.sort().pop();
    
    const latestDir = path.join(resultsDir, latestTimestamp);
    const files = await fs.readdir(latestDir);
    const csvFile = files.find(file => file.endsWith('.csv'));
    
    const csvPath = path.join(latestDir, csvFile);
    console.log(`Results saved to: ${csvPath}`);
    
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
    
    console.log('\n=== Next Page Related Events (Last 90 Days) ===');
    console.log('');
    
    if (data.length === 0) {
      console.log('No next-page related events found.');
      return data;
    }
    
    // Display results in a formatted table
    console.log('Event Name\t\t\tEvent Count\tUnique Sessions\tEarliest\t\tLatest');
    console.log('----------\t\t\t-----------\t---------------\t--------\t\t------');
    
    data.forEach(row => {
      const eventName = (row.event_name || 'N/A').substring(0, 30);
      const eventCount = row.event_count || '0';
      const uniqueSessions = row.unique_sessions || '0';
      const earliest = (row.earliest_event || 'N/A').substring(0, 16);
      const latest = (row.latest_event || 'N/A').substring(0, 16);
      
      console.log(`${eventName}\t\t${eventCount}\t\t${uniqueSessions}\t\t\t${earliest}\t${latest}`);
    });
    
    return data;
    
  } catch (error) {
    console.error('Error running debug query:', error);
    throw error;
  }
}

// Allow running directly from command line
if (require.main === module) {
  runDebugNextPageEvents()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to run debug:', error);
      process.exit(1);
    });
}

module.exports = { runDebugNextPageEvents };
