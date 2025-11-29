#!/usr/bin/env node

/**
 * SmartScroll Density & Position Experiment Analysis
 * 
 * Usage:
 *   node smartscroll-density-position-experiment.js [--days-back=14] [--use-cached]
 * 
 * Options:
 *   --days-back=N    Number of days to analyze (default: 14)
 *   --use-cached     Use cached results if available
 */

const { executeQuery } = require('../helpers/athenaQueryExecutor');
const path = require('path');
const fs = require('fs').promises;

const QUERY_NAME = 'smartscroll-density-position-experiment';
const TIMESERIES_QUERY_NAME = 'smartscroll-density-position-timeseries';

async function runExperimentAnalysis(daysBack = 14, useCached = false) {
    console.log(`\n🔬 SmartScroll Density & Position Experiment Analysis`);
    console.log(`📅 Analyzing last ${daysBack} days`);
    console.log(`📊 ${useCached ? 'Using cached results' : 'Running fresh queries'}\n`);

    try {
        // Run main experiment analysis
        console.log('📈 Running main experiment analysis...');
        const result = await executeQuery(QUERY_NAME, { days_back: daysBack }, useCached);
        
        if (result.success) {
            console.log('✅ Main analysis completed successfully');
            console.log(`📁 Results saved to: ${result.outputLocation}`);
            
            // Parse and display results
            const timestamp = result.outputLocation.split('/').slice(-2, -1)[0];
            const localFilePath = path.join(__dirname, '..', 'data', 'athena-results', QUERY_NAME, timestamp, `${result.queryExecutionId}.csv`);
            
            try {
                const csvContent = await fs.readFile(localFilePath, 'utf8');
                const lines = csvContent.trim().split('\n');
                const headers = lines[0].split(',');
                const data = lines.slice(1).map(line => {
                    const values = line.split(',');
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header.trim()] = values[index]?.trim() || '';
                    });
                    return row;
                });

                console.log('\n📊 EXPERIMENT RESULTS:');
                console.log('=' .repeat(80));
                
                data.forEach(row => {
                    console.log(`\n🎯 Variant: ${row.variant}`);
                    console.log(`   Sessions: ${row.sessions}`);
                    console.log(`   In Views: ${row.in_views}`);
                    console.log(`   Store Clicks: ${row.store_clicks}`);
                    console.log(`   Next Page Clicks: ${row.next_page_clicks}`);
                    console.log(`   Store CTR: ${row.store_ctr_percent}% (${row.store_ctr_significance})`);
                    console.log(`   Next Page CTR: ${row.next_page_ctr_percent}% (${row.next_page_ctr_significance})`);
                    console.log(`   Overall Engagement: ${row.overall_engagement_percent}%`);
                    console.log(`   Store Discovery: ${row.store_discovery_percent}%`);
                    console.log(`   Article Discovery: ${row.article_discovery_percent}%`);
                });

                // Calculate lift vs control
                const control = data.find(row => row.variant === 'control');
                if (control) {
                    console.log('\n📈 LIFT ANALYSIS (vs Control):');
                    console.log('=' .repeat(50));
                    
                    data.forEach(row => {
                        if (row.variant !== 'control') {
                            const storeLift = ((parseFloat(row.store_ctr_percent) - parseFloat(control.store_ctr_percent)) / parseFloat(control.store_ctr_percent) * 100).toFixed(2);
                            const nextPageLift = ((parseFloat(row.next_page_ctr_percent) - parseFloat(control.next_page_ctr_percent)) / parseFloat(control.next_page_ctr_percent) * 100).toFixed(2);
                            
                            console.log(`\n🎯 ${row.variant}:`);
                            console.log(`   Store CTR Lift: ${storeLift}%`);
                            console.log(`   Next Page CTR Lift: ${nextPageLift}%`);
                        }
                    });
                }

            } catch (error) {
                console.log('⚠️  Could not parse results file:', error.message);
            }
        } else {
            console.error('❌ Main analysis failed:', result.error);
        }

        // Run time series analysis
        console.log('\n📈 Running time series analysis...');
        const timeseriesResult = await executeQuery(TIMESERIES_QUERY_NAME, { days_back: daysBack }, useCached);
        
        if (timeseriesResult.success) {
            console.log('✅ Time series analysis completed successfully');
            console.log(`📁 Results saved to: ${timeseriesResult.outputLocation}`);
        } else {
            console.error('❌ Time series analysis failed:', timeseriesResult.error);
        }

    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        process.exit(1);
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
let daysBack = 14;
let useCached = false;

args.forEach(arg => {
    if (arg.startsWith('--days-back=')) {
        daysBack = parseInt(arg.split('=')[1]) || 14;
    } else if (arg === '--use-cached') {
        useCached = true;
    }
});

// Run the analysis
runExperimentAnalysis(daysBack, useCached);
