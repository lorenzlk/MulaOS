const { executeQuery } = require('../utils/query-runner');
const fs = require('fs').promises;
const path = require('path');

/**
 * Run Stylecaster mulaAuto Experiment Analysis
 * @param {Object} options - Query options
 * @param {number} options.days_back - Number of days to look back (default: 30)
 */
async function runStylecasterMulaAutoExperiment(options = {}) {
  const {
    days_back = 30
  } = options;

  const queryName = 'stylecaster-mulaauto-experiment';
  
  console.log(`🔬 Running Stylecaster mulaAuto Experiment Analysis...`);
  console.log(`📅 Days back: ${days_back}`);
  
  try {
    const executionResult = await executeQuery(queryName, {
      parameters: {
        days_back
      }
    });
    
    // Find the most recent CSV results file
    const resultsDir = path.join(__dirname, '..', '..', 'data', 'athena-results', queryName);
    const timestampDirs = await fs.readdir(resultsDir);
    const latestTimestamp = timestampDirs.sort().pop(); // Get the most recent timestamp directory
    const csvPath = path.join(resultsDir, latestTimestamp, `${executionResult.queryExecutionId}.csv`);
    
    console.log(`📁 Reading results from: ${csvPath}`);
    
    const csvContent = await fs.readFile(csvPath, 'utf8');
    const lines = csvContent.trim().split('\n');
    
    // Parse CSV
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const results = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.replace(/"/g, '').trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      return row;
    });
    
    console.log('\n=== Stylecaster mulaAuto Experiment Results ===');
    console.log(`📅 Analysis Period: ${days_back} days`);
    console.log('');
    
    if (results.length === 0) {
      console.log('❌ No data found for the specified time period.');
      return results;
    }
    
    // Display results in a formatted table
    console.log('Variant\t\tSessions\tAvg Time (s)\tMedian Time (s)\tAvg Scroll Pixels\tMedian Scroll Pixels\tAvg Scroll %\tMedian Scroll %');
    console.log('-------\t\t--------\t------------\t---------------\t------------------\t-------------------\t------------\t-------------');
    
    results.forEach(row => {
      const variant = (row.variant || '').padEnd(12);
      const sessions = (row.sessions || '0').toString().padStart(8);
      const avgTime = (row.avg_time_on_page_seconds || '0').toString().padStart(12);
      const medianTime = (row.median_time_on_page_seconds || '0').toString().padStart(15);
      const avgScrollPx = (row.avg_scroll_depth_pixels || '0').toString().padStart(18);
      const medianScrollPx = (row.median_scroll_depth_pixels || '0').toString().padStart(19);
      const avgScrollPct = (row.avg_scroll_depth_percent || '0').toString().padStart(12);
      const medianScrollPct = (row.median_scroll_depth_percent || '0').toString().padStart(13);
      
      console.log(`${variant}\t${sessions}\t${avgTime}\t${medianTime}\t${avgScrollPx}\t${medianScrollPx}\t${avgScrollPct}\t${medianScrollPct}`);
    });
    
    console.log('');
    
    // Display lift metrics and significance
    const control = results.find(r => r.variant === 'control');
    const test = results.find(r => r.variant === 'test');
    
    if (control && test) {
      console.log('=== Key Insights (Test vs Control) ===');
      console.log(`🎯 Control Baseline:`);
      console.log(`   Sessions: ${control.sessions}`);
      console.log(`   Avg Time on Page: ${control.avg_time_on_page_seconds}s`);
      console.log(`   Median Time on Page: ${control.median_time_on_page_seconds}s`);
      console.log(`   Avg Scroll Depth: ${control.avg_scroll_depth_pixels}px (${control.avg_scroll_depth_percent}%)`);
      console.log(`   Median Scroll Depth: ${control.median_scroll_depth_pixels}px (${control.median_scroll_depth_percent}%)`);
      console.log('');
      
      console.log(`📊 Test (mulaAuto=1):`);
      console.log(`   Sessions: ${test.sessions}`);
      console.log(`   Avg Time on Page: ${test.avg_time_on_page_seconds}s`);
      console.log(`   Median Time on Page: ${test.median_time_on_page_seconds}s`);
      console.log(`   Avg Scroll Depth: ${test.avg_scroll_depth_pixels}px (${test.avg_scroll_depth_percent}%)`);
      console.log(`   Median Scroll Depth: ${test.median_scroll_depth_pixels}px (${test.median_scroll_depth_percent}%)`);
      console.log('');
      
      if (test.time_lift_percent) {
        const timeLift = parseFloat(test.time_lift_percent);
        console.log(`⏱️  Time on Page:`);
        console.log(`   Lift: ${timeLift > 0 ? '+' : ''}${timeLift.toFixed(2)}%`);
        console.log(`   Significance: ${test.time_p_value || 'N/A'}`);
        console.log('');
      }
      
      if (test.scroll_pixels_lift_percent) {
        const scrollLift = parseFloat(test.scroll_pixels_lift_percent);
        console.log(`📏 Scroll Depth (Pixels):`);
        console.log(`   Lift: ${scrollLift > 0 ? '+' : ''}${scrollLift.toFixed(2)}%`);
        console.log(`   Significance: ${test.scroll_pixels_p_value || 'N/A'}`);
        console.log('');
      }
      
      if (test.scroll_percent_lift_percent) {
        const scrollPctLift = parseFloat(test.scroll_percent_lift_percent);
        console.log(`📏 Scroll Depth (Percent):`);
        console.log(`   Lift: ${scrollPctLift > 0 ? '+' : ''}${scrollPctLift.toFixed(2)}%`);
        console.log(`   Significance: ${test.scroll_percent_p_value || 'N/A'}`);
        console.log('');
      }
      
      // Summary
      const significantMetrics = [];
      if (test.time_p_value && test.time_p_value !== '> 0.05' && test.time_p_value !== 'N/A') {
        significantMetrics.push(`Time on Page (${test.time_p_value})`);
      }
      if (test.scroll_pixels_p_value && test.scroll_pixels_p_value !== '> 0.05' && test.scroll_pixels_p_value !== 'N/A') {
        significantMetrics.push(`Scroll Depth Pixels (${test.scroll_pixels_p_value})`);
      }
      if (test.scroll_percent_p_value && test.scroll_percent_p_value !== '> 0.05' && test.scroll_percent_p_value !== 'N/A') {
        significantMetrics.push(`Scroll Depth Percent (${test.scroll_percent_p_value})`);
      }
      
      if (significantMetrics.length > 0) {
        console.log('🏆 STATISTICALLY SIGNIFICANT RESULTS:');
        significantMetrics.forEach(metric => {
          console.log(`   ✅ ${metric}`);
        });
      } else {
        console.log('⚠️  No statistically significant results found (p > 0.05 for all metrics).');
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Error running Stylecaster mulaAuto Experiment Analysis:', error);
    throw error;
  }
}

module.exports = { runStylecasterMulaAutoExperiment };

// Allow running directly from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  let daysBack = 30;
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--days-back' && i + 1 < args.length) {
      daysBack = parseInt(args[i + 1]);
      i++; // Skip next argument
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Stylecaster mulaAuto Experiment Analysis

Usage: node stylecaster-mulaauto-experiment.js [options]

Options:
  --days-back <number>       Number of days to look back (default: 30)
  --help, -h                 Show this help message

Examples:
  node stylecaster-mulaauto-experiment.js
  node stylecaster-mulaauto-experiment.js --days-back 14

Description:
  This script analyzes the Stylecaster mulaAuto experiment which compares:
  - Control: URLs without mulaAuto=1 parameter
  - Test: URLs with mulaAuto=1 parameter

Metrics:
  - Time on Page: Average and median time spent on page (seconds)
  - Scroll Depth: Average and median scroll depth (pixels and percent)
  - Statistical Significance: T-test p-values for all metrics
            `);
      process.exit(0);
    }
  }
  
  runStylecasterMulaAutoExperiment({ 
    days_back: daysBack
  })
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to run analysis:', error);
      process.exit(1);
    });
}

