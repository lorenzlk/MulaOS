const { executeQuery } = require('../utils/query-runner');
const fs = require('fs').promises;
const path = require('path');

/**
 * Run SmartScroll Factorial CTR Analysis
 * @param {Object} options - Query options
 * @param {number} options.days_back - Number of days to look back (default: 30)
 * @param {string} options.experiment_name - Name of the experiment (default: 'smartscroll_factorial_2025_09')
 * @param {boolean} options.use_cached - Use cached results instead of running new query (default: false)
 */
async function runSmartScrollFactorialCTR(options = {}) {
  const {
    days_back = 30,
    experiment_name = 'smartscroll_factorial_2025_09',
    use_cached = false
  } = options;

  const queryName = 'smartscroll-factorial-ctr';
  
  console.log(`Running SmartScroll Factorial CTR Analysis...`);
  console.log(`Days back: ${days_back}`);
  console.log(`Experiment: ${experiment_name}`);
  console.log(`Use cached results: ${use_cached}`);
  
  try {
    let csvPath;
    
    if (use_cached) {
      // Find the most recent CSV results file
      const resultsDir = path.join(__dirname, '..', '..', 'data', 'athena-results', queryName);
      const timestampDirs = await fs.readdir(resultsDir);
      const latestTimestamp = timestampDirs.sort().pop(); // Get the most recent timestamp directory
      
      if (!latestTimestamp) {
        throw new Error('No cached results found. Run without --use-cached first.');
      }
      
      // Find the CSV file in the latest timestamp directory
      const latestDir = path.join(resultsDir, latestTimestamp);
      const files = await fs.readdir(latestDir);
      const csvFile = files.find(f => f.endsWith('.csv'));
      
      if (!csvFile) {
        throw new Error('No CSV results file found in latest directory.');
      }
      
      csvPath = path.join(latestDir, csvFile);
      console.log(`Using cached results from: ${csvPath}`);
    } else {
      const executionResult = await executeQuery(queryName, {
        parameters: {
          days_back,
          experiment_name
        }
      });
      
      // Find the most recent CSV results file
      const resultsDir = path.join(__dirname, '..', '..', 'data', 'athena-results', queryName);
      const timestampDirs = await fs.readdir(resultsDir);
      const latestTimestamp = timestampDirs.sort().pop(); // Get the most recent timestamp directory
      csvPath = path.join(resultsDir, latestTimestamp, `${executionResult.queryExecutionId}.csv`);
      
      console.log(`Reading results from: ${csvPath}`);
    }
    
    const csvContent = await fs.readFile(csvPath, 'utf8');
    const lines = csvContent.trim().split('\n');
    
    // Parse CSV (simple parsing for now)
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    const results = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.replace(/"/g, ''));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      return row;
    });
    
    console.log('\n=== SmartScroll Factorial CTR Analysis Results ===');
    console.log('Experiment:', experiment_name);
    console.log('Analysis Period:', `${days_back} days`);
    console.log('Scope: Network-wide');
    console.log('');
    
    if (results.length === 0) {
      console.log('No data found for the specified experiment and time period.');
      return results;
    }
    
    // Display results in a formatted table
    console.log('Variant\t\tDescription\t\t\t\t\tSessions\tViews\t\tClicks\t\tCTR (%)\t\tChi-Square\tSignificance');
    console.log('-------\t\t-----------\t\t\t\t\t--------\t-----\t\t------\t\t--------\t\t----------\t------------');
    
    results.forEach(row => {
      const variant = row.variant || 'N/A';
      const description = (row.variant_description || 'N/A').substring(0, 40) + '...';
      const sessions = row.sessions || '0';
      const views = row.views || '0';
      const clicks = row.clicks || '0';
      const ctr = row.ctr_percent || '0.0000';
      const chiSquare = row.chi_square_statistic || '0.0000';
      const significance = row.significance || 'N/A';
      
      console.log(`${variant}\t\t${description}\t\t${sessions}\t\t${views}\t\t${clicks}\t\t${ctr}\t\t${chiSquare}\t\t${significance}`);
    });
    
    // Find the best performing variant
    const bestVariant = results.reduce((best, current) => {
      const currentCTR = parseFloat(current.ctr_percent) || 0;
      const bestCTR = parseFloat(best.ctr_percent) || 0;
      return currentCTR > bestCTR ? current : best;
    });
    
    console.log('\n=== Key Insights ===');
    console.log(`Best Performing Variant: ${bestVariant.variant} (${bestVariant.variant_description})`);
    console.log(`Best CTR: ${bestVariant.ctr_percent}%`);
    console.log(`Statistical Significance: ${bestVariant.significance}`);
    
    return results;
    
  } catch (error) {
    console.error('Error running SmartScroll Factorial CTR Analysis:', error);
    throw error;
  }
}

module.exports = { runSmartScrollFactorialCTR };

// Allow running directly from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  let daysBack = 30;
  let experimentName = 'smartscroll_factorial_2025_09';
  let useCached = false;
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--use-cached' || arg === '--cached') {
      useCached = true;
    } else if (arg === '--days-back' && i + 1 < args.length) {
      daysBack = parseInt(args[i + 1]);
      i++; // Skip next argument
    } else if (arg === '--experiment' && i + 1 < args.length) {
      experimentName = args[i + 1];
      i++; // Skip next argument
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
SmartScroll Factorial CTR Analysis

Usage: node smartscroll-factorial-ctr.js [options]

Options:
  --use-cached, --cached     Use cached results instead of running new query
  --days-back <number>       Number of days to look back (default: 30)
  --experiment <name>        Experiment name (default: 'smartscroll_factorial_2025_09')
  --help, -h                 Show this help message

Examples:
  node smartscroll-factorial-ctr.js
  node smartscroll-factorial-ctr.js --use-cached
  node smartscroll-factorial-ctr.js --days-back 14
  node smartscroll-factorial-ctr.js --experiment my_experiment --days-back 7
            `);
      process.exit(0);
    }
  }
  
  runSmartScrollFactorialCTR({ 
    days_back: daysBack, 
    experiment_name: experimentName,
    use_cached: useCached
  })
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to run analysis:', error);
      process.exit(1);
    });
}
