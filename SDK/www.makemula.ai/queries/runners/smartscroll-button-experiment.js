const { executeQuery } = require('../utils/query-runner');
const fs = require('fs').promises;
const path = require('path');

/**
 * Run SmartScroll Button A/B Test Analysis
 * @param {Object} options - Query options
 * @param {number} options.days_back - Number of days to look back (default: 7)
 * @param {string} options.experiment_name - Name of the experiment (default: 'smartscroll_button_variant')
 * @param {boolean} options.use_cached - Use cached results instead of running new query (default: false)
 */
async function runSmartScrollButtonExperiment(options = {}) {
  const {
    days_back = 7,
    experiment_name = 'smartscroll_button_variant',
    use_cached = false
  } = options;

  const queryName = 'smartscroll-button-experiment';
  
  console.log(`Running SmartScroll Button A/B Test Analysis...`);
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
    
    console.log('\n=== SmartScroll Button A/B Test Results ===');
    console.log('Experiment:', experiment_name);
    console.log('Analysis Period:', `${days_back} days`);
    console.log('');
    
    if (results.length === 0) {
      console.log('No data found for the specified experiment and time period.');
      return results;
    }
    
    // Display results in a formatted table
    console.log('Variant\t\tWidget Views\tStore Clicks\tCTR (%)\t\tLift (%)\t\tChi-Square\tP-Value\t\tSignificance');
    console.log('-------\t\t------------\t-------------\t--------\t\t--------\t\t----------\t--------\t\t------------');
    
    results.forEach(row => {
      const variant = row.variant.padEnd(12);
      const widgetViews = row.widget_views.toString().padStart(12);
      const storeClicks = row.store_clicks.toString().padStart(13);
      // Parse numbers safely
      const ctrNum = row.ctr_percent && row.ctr_percent !== '' ? Number(row.ctr_percent) : 0;
      const liftNum = row.ctr_lift_percent && row.ctr_lift_percent !== '' ? Number(row.ctr_lift_percent) : null;
      const chiSquareNum = row.chi_square_statistic && row.chi_square_statistic !== '' ? Number(row.chi_square_statistic) : null;
      const pValueNum = row.p_value && row.p_value !== '' ? Number(row.p_value) : null;
      
      const ctr = ctrNum.toFixed(4).padStart(8);
      const lift = liftNum !== null ? liftNum.toFixed(2).padStart(8) : 'N/A'.padStart(8);
      const chiSquare = chiSquareNum !== null ? chiSquareNum.toFixed(4).padStart(10) : 'N/A'.padStart(10);
      const pValue = pValueNum !== null ? pValueNum.toFixed(4).padStart(8) : 'N/A'.padStart(8);
      const significance = row.statistical_significance.padStart(12);
      
      console.log(`${variant}\t${widgetViews}\t${storeClicks}\t${ctr}\t\t${lift}\t\t${chiSquare}\t${pValue}\t\t${significance}`);
    });
    
    console.log('');
    
    // Summary insights
    const control = results.find(r => r.variant === 'control');
    const treatment = results.find(r => r.variant === 'buy_now');
    
    if (control && treatment) {
      const controlCtr = control.ctr_percent && control.ctr_percent !== '' ? Number(control.ctr_percent) : 0;
      const treatmentCtr = treatment.ctr_percent && treatment.ctr_percent !== '' ? Number(treatment.ctr_percent) : 0;
      const lift = treatment.ctr_lift_percent && treatment.ctr_lift_percent !== '' ? Number(treatment.ctr_lift_percent) : null;
      const chiSquare = treatment.chi_square_statistic && treatment.chi_square_statistic !== '' ? Number(treatment.chi_square_statistic) : null;
      const pValue = treatment.p_value && treatment.p_value !== '' ? Number(treatment.p_value) : null;
      
      console.log('=== Key Insights ===');
      console.log(`Control CTR: ${controlCtr.toFixed(4)}%`);
      console.log(`Treatment CTR: ${treatmentCtr.toFixed(4)}%`);
      console.log(`Lift: ${lift !== null ? lift.toFixed(2) : 'N/A'}%`);
      console.log(`Chi-Square Statistic: ${chiSquare !== null ? chiSquare.toFixed(4) : 'N/A'}`);
      console.log(`P-Value: ${pValue !== null ? pValue.toFixed(4) : 'N/A'}`);
      console.log(`Statistical Significance: ${treatment.statistical_significance}`);
      
      if (treatment.statistical_significance.includes('Significant')) {
        console.log('✅ The treatment shows statistically significant improvement!');
      } else {
        console.log('⚠️  The treatment does not show statistically significant improvement.');
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('Error running SmartScroll Button A/B Test Analysis:', error);
    throw error;
  }
}

module.exports = { runSmartScrollButtonExperiment };

// Allow running directly from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  let daysBack = 7;
  let experimentName = 'smartscroll_button_variant';
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
SmartScroll Button A/B Test Analysis

Usage: node smartscroll-button-experiment.js [options]

Options:
  --use-cached, --cached     Use cached results instead of running new query
  --days-back <number>       Number of days to look back (default: 7)
  --experiment <name>        Experiment name (default: 'smartscroll_button_variant')
  --help, -h                 Show this help message

Examples:
  node smartscroll-button-experiment.js
  node smartscroll-button-experiment.js --use-cached
  node smartscroll-button-experiment.js --days-back 14 --use-cached
  node smartscroll-button-experiment.js --experiment my_experiment
            `);
      process.exit(0);
    } else if (!arg.startsWith('--')) {
      // Positional arguments for backward compatibility
      if (typeof daysBack === 'number' && daysBack === 7) {
        daysBack = parseInt(arg);
      } else {
        experimentName = arg;
      }
    }
  }
  
  runSmartScrollButtonExperiment({ 
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