const { executeQuery } = require('../utils/query-runner');
const fs = require('fs').promises;
const path = require('path');

/**
 * Run SmartScroll Density & Position Experiment Analysis
 * @param {Object} options - Query options
 * @param {number} options.days_back - Number of days to look back (default: 14)
 * @param {string} options.experiment_name - Name of the experiment (default: 'smartscroll_density_position_2025_10')
 * @param {boolean} options.use_cached - Use cached results instead of running new query (default: false)
 */
async function runSmartScrollDensityPositionExperiment(options = {}) {
  const {
    days_back = 14,
    experiment_name = 'smartscroll_density_position_2025_10',
    use_cached = false
  } = options;

  const queryName = 'smartscroll-density-position-experiment';
  
  console.log(`🔬 Running SmartScroll Density & Position Experiment Analysis...`);
  console.log(`📅 Days back: ${days_back}`);
  console.log(`🧪 Experiment: ${experiment_name}`);
  console.log(`💾 Use cached results: ${use_cached}`);
  
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
      console.log(`📁 Using cached results from: ${csvPath}`);
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
      
      console.log(`📁 Reading results from: ${csvPath}`);
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
    
    console.log('\n=== SmartScroll Density & Position Experiment Results ===');
    console.log(`🧪 Experiment: ${experiment_name}`);
    console.log(`📅 Analysis Period: ${days_back} days`);
    console.log('');
    
    if (results.length === 0) {
      console.log('❌ No data found for the specified experiment and time period.');
      return results;
    }
    
    // Display results in a formatted table
    console.log('Variant\t\t\tSessions\tIn Views\tStore Clicks\tNext Page Clicks\tStore CTR\tNext Page CTR\tOverall Engagement');
    console.log('-------\t\t\t--------\t--------\t-------------\t----------------\t----------\t-------------\t------------------');
    
    results.forEach(row => {
      const variant = row.variant.padEnd(20);
      const sessions = row.sessions.toString().padStart(8);
      const inViews = row.in_views.toString().padStart(8);
      const storeClicks = row.store_clicks.toString().padStart(13);
      const nextPageClicks = row.next_page_clicks.toString().padStart(16);
      
      // Parse numbers safely
      const storeCtrNum = row.store_ctr_percent && row.store_ctr_percent !== '' ? Number(row.store_ctr_percent) : 0;
      const nextPageCtrNum = row.next_page_ctr_percent && row.next_page_ctr_percent !== '' ? Number(row.next_page_ctr_percent) : 0;
      const overallEngagementNum = row.overall_engagement_percent && row.overall_engagement_percent !== '' ? Number(row.overall_engagement_percent) : 0;
      
      const storeCtr = storeCtrNum.toFixed(4).padStart(10);
      const nextPageCtr = nextPageCtrNum.toFixed(4).padStart(13);
      const overallEngagement = overallEngagementNum.toFixed(4).padStart(18);
      
      console.log(`${variant}\t${sessions}\t${inViews}\t${storeClicks}\t${nextPageClicks}\t\t${storeCtr}\t${nextPageCtr}\t${overallEngagement}`);
    });
    
    console.log('');
    
    // Statistical significance table
    console.log('=== Statistical Significance ===');
    console.log('Variant\t\t\tStore CTR Significance\t\tNext Page CTR Significance');
    console.log('-------\t\t\t----------------------\t\t-------------------------');
    
    results.forEach(row => {
      const variant = row.variant.padEnd(20);
      const storeSignificance = row.store_ctr_significance.padEnd(22);
      const nextPageSignificance = row.next_page_ctr_significance.padEnd(25);
      console.log(`${variant}\t${storeSignificance}\t${nextPageSignificance}`);
    });
    
    console.log('');
    
    // Summary insights
    const control = results.find(r => r.variant === 'control');
    const densityInverted = results.find(r => r.variant === 'density_inverted');
    const positionEarly = results.find(r => r.variant === 'position_early');
    
    if (control) {
      console.log('=== Key Insights (vs Control) ===');
      console.log(`🎯 Control Baseline:`);
      console.log(`   Store CTR: ${control.store_ctr_percent}%`);
      console.log(`   Next Page CTR: ${control.next_page_ctr_percent}%`);
      console.log(`   Overall Engagement: ${control.overall_engagement_percent}%`);
      console.log('');
      
      if (densityInverted) {
        const storeLift = ((parseFloat(densityInverted.store_ctr_percent) - parseFloat(control.store_ctr_percent)) / parseFloat(control.store_ctr_percent) * 100).toFixed(2);
        const nextPageLift = ((parseFloat(densityInverted.next_page_ctr_percent) - parseFloat(control.next_page_ctr_percent)) / parseFloat(control.next_page_ctr_percent) * 100).toFixed(2);
        
        console.log(`📊 Density Inverted:`);
        console.log(`   Store CTR: ${densityInverted.store_ctr_percent}% (${storeLift > 0 ? '+' : ''}${storeLift}% lift)`);
        console.log(`   Next Page CTR: ${densityInverted.next_page_ctr_percent}% (${nextPageLift > 0 ? '+' : ''}${nextPageLift}% lift)`);
        console.log(`   Store CTR Significance: ${densityInverted.store_ctr_significance}`);
        console.log(`   Next Page CTR Significance: ${densityInverted.next_page_ctr_significance}`);
        console.log('');
      }
      
      if (positionEarly) {
        const storeLift = ((parseFloat(positionEarly.store_ctr_percent) - parseFloat(control.store_ctr_percent)) / parseFloat(control.store_ctr_percent) * 100).toFixed(2);
        const nextPageLift = ((parseFloat(positionEarly.next_page_ctr_percent) - parseFloat(control.next_page_ctr_percent)) / parseFloat(control.next_page_ctr_percent) * 100).toFixed(2);
        
        console.log(`📊 Position Early:`);
        console.log(`   Store CTR: ${positionEarly.store_ctr_percent}% (${storeLift > 0 ? '+' : ''}${storeLift}% lift)`);
        console.log(`   Next Page CTR: ${positionEarly.next_page_ctr_percent}% (${nextPageLift > 0 ? '+' : ''}${nextPageLift}% lift)`);
        console.log(`   Store CTR Significance: ${positionEarly.store_ctr_significance}`);
        console.log(`   Next Page CTR Significance: ${positionEarly.next_page_ctr_significance}`);
        console.log('');
      }
      
      // Determine winner
      const variants = [densityInverted, positionEarly].filter(Boolean);
      const significantVariants = variants.filter(v => 
        v.store_ctr_significance.includes('Significant') || 
        v.next_page_ctr_significance.includes('Significant')
      );
      
      if (significantVariants.length > 0) {
        console.log('🏆 SIGNIFICANT RESULTS FOUND:');
        significantVariants.forEach(variant => {
          console.log(`   ✅ ${variant.variant}: ${variant.store_ctr_significance} (Store CTR), ${variant.next_page_ctr_significance} (Next Page CTR)`);
        });
      } else {
        console.log('⚠️  No statistically significant results found yet. Consider running for a longer period.');
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Error running SmartScroll Density & Position Experiment Analysis:', error);
    throw error;
  }
}

module.exports = { runSmartScrollDensityPositionExperiment };

// Allow running directly from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  let daysBack = 14;
  let experimentName = 'smartscroll_density_position_2025_10';
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
SmartScroll Density & Position Experiment Analysis

Usage: node smartscroll-density-position-experiment.js [options]

Options:
  --use-cached, --cached     Use cached results instead of running new query
  --days-back <number>       Number of days to look back (default: 14)
  --experiment <name>        Experiment name (default: 'smartscroll_density_position_2025_10')
  --help, -h                 Show this help message

Examples:
  node smartscroll-density-position-experiment.js
  node smartscroll-density-position-experiment.js --use-cached
  node smartscroll-density-position-experiment.js --days-back 7 --use-cached
  node smartscroll-density-position-experiment.js --experiment my_experiment

Description:
  This script analyzes the SmartScroll Density & Position experiment which tests:
  - Control: 3-1 products, position 4 (current behavior)
  - Density Inverted: 3-1 articles, position 4 (more articles)
  - Position Early: 3-1 products, position 1 (earlier placement)

Metrics:
  - Store CTR: mula_store_click / mula_in_view
  - Next Page CTR: mula_next_page_click / mula_in_view
  - Overall Engagement: (store_clicks + next_page_clicks) / in_views
            `);
      process.exit(0);
    } else if (!arg.startsWith('--')) {
      // Positional arguments for backward compatibility
      if (typeof daysBack === 'number' && daysBack === 14) {
        daysBack = parseInt(arg);
      } else {
        experimentName = arg;
      }
    }
  }
  
  runSmartScrollDensityPositionExperiment({ 
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
