#!/usr/bin/env node

const { runSmartScrollButtonExperiment } = require('../queries/runners/smartscroll-button-experiment.js');
const { sendSlackMessage } = require('../helpers/SlackHelpers.js');

/**
 * Generate Slack blocks for SmartScroll A/B test report
 */
function generateSlackBlocks(results, experimentName, daysBack) {
    const formattedDate = new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZoneName: 'short'
    });

    const blocks = [
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: "*🧪 SmartScroll A/B Test Report*"
            }
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*Experiment:* ${experimentName}\n*Analysis Period:* ${daysBack} days\n*Generated:* ${formattedDate}`
            }
        },
        {
            type: 'divider'
        }
    ];

    if (results.length === 0) {
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: "❌ No data found for the specified experiment and time period."
            }
        });
        return blocks;
    }

    // Block Kit “Cards” (Fields) for each variant, chunked to 10 fields per section
    const buyNow = results.find(r => r.variant === 'buy_now');
    const control = results.find(r => r.variant === 'control');
    function val(row, key, digits = 4) {
      if (!row) return 'N/A';
      if (row[key] === undefined || row[key] === null || row[key] === '') return 'N/A';
      if (typeof row[key] === 'number' || !isNaN(Number(row[key]))) {
        return Number(row[key]).toFixed(digits);
      }
      return row[key];
    }
    // Header block
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Results Summary:*'
      }
    });
    // Helper to chunk fields
    function chunkFields(fields) {
      for (let i = 0; i < fields.length; i += 10) {
        blocks.push({ type: 'section', fields: fields.slice(i, i + 10) });
      }
    }
    // Card for Buy Now
    if (buyNow) {
      const buyNowFields = [
        { type: 'plain_text', text: 'Variant:', emoji: true },
        { type: 'plain_text', text: 'Buy Now', emoji: true },
        { type: 'plain_text', text: 'Widget Views:', emoji: true },
        { type: 'plain_text', text: String(buyNow.widget_views), emoji: true },
        { type: 'plain_text', text: 'Store Clicks:', emoji: true },
        { type: 'plain_text', text: String(buyNow.store_clicks), emoji: true },
        { type: 'plain_text', text: 'CTR (%):', emoji: true },
        { type: 'plain_text', text: val(buyNow, 'ctr_percent'), emoji: true },
        { type: 'plain_text', text: 'Lift (%):', emoji: true },
        { type: 'plain_text', text: val(buyNow, 'ctr_lift_percent', 2), emoji: true },
        { type: 'plain_text', text: 'Chi-Square:', emoji: true },
        { type: 'plain_text', text: val(buyNow, 'chi_square_statistic'), emoji: true },
        { type: 'plain_text', text: 'P-Value:', emoji: true },
        { type: 'plain_text', text: val(buyNow, 'p_value'), emoji: true },
        { type: 'plain_text', text: 'Significance:', emoji: true },
        { type: 'plain_text', text: buyNow.statistical_significance, emoji: true }
      ];
      chunkFields(buyNowFields);
    }
    // Card for Control
    if (control) {
      const controlFields = [
        { type: 'plain_text', text: 'Variant:', emoji: true },
        { type: 'plain_text', text: 'Control', emoji: true },
        { type: 'plain_text', text: 'Widget Views:', emoji: true },
        { type: 'plain_text', text: String(control.widget_views), emoji: true },
        { type: 'plain_text', text: 'Store Clicks:', emoji: true },
        { type: 'plain_text', text: String(control.store_clicks), emoji: true },
        { type: 'plain_text', text: 'CTR (%):', emoji: true },
        { type: 'plain_text', text: val(control, 'ctr_percent'), emoji: true },
        { type: 'plain_text', text: 'Lift (%):', emoji: true },
        { type: 'plain_text', text: 'N/A', emoji: true },
        { type: 'plain_text', text: 'Chi-Square:', emoji: true },
        { type: 'plain_text', text: 'N/A', emoji: true },
        { type: 'plain_text', text: 'P-Value:', emoji: true },
        { type: 'plain_text', text: 'N/A', emoji: true },
        { type: 'plain_text', text: 'Significance:', emoji: true },
        { type: 'plain_text', text: control.statistical_significance, emoji: true }
      ];
      chunkFields(controlFields);
    }

    // Add key insights
    if (control && buyNow) {
      const controlCtr = val(control, 'ctr_percent');
      const treatmentCtr = val(buyNow, 'ctr_percent');
      const lift = val(buyNow, 'ctr_lift_percent', 2);
      const chiSquare = val(buyNow, 'chi_square_statistic');
      const pValue = val(buyNow, 'p_value');
      const significance = buyNow.statistical_significance;
      let insightsText = "*Key Insights:*\n";
      insightsText += `• Control CTR: ${controlCtr}%\n`;
      insightsText += `• Treatment CTR: ${treatmentCtr}%\n`;
      insightsText += `• Lift: ${lift}%\n`;
      insightsText += `• Chi-Square Statistic: ${chiSquare}\n`;
      insightsText += `• P-Value: ${pValue}\n`;
      insightsText += `• Statistical Significance: ${significance}\n\n`;
      // Only show significant improvement if significance string includes 'Significant' and p < 0.05
      if (significance && significance.includes('Significant') && Number(pValue) < 0.05) {
        insightsText += '✅ *The treatment shows statistically significant improvement!*';
      } else {
        insightsText += '⚠️ *No statistically significant difference detected.*';
      }
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: insightsText }
      });
    }

    return blocks;
}

/**
 * Main function to run the SmartScroll A/B test report and send to Slack
 */
async function runSmartScrollABTestSlackReport(options = {}) {
    const {
        days_back = 7,
        experiment_name = 'smartscroll_button_variant',
        use_cached = false,
        channel = '#proj-mula-reports'
    } = options;

    console.log('🚀 Starting SmartScroll A/B Test Slack Report...');
    console.log(`Days back: ${days_back}`);
    console.log(`Experiment: ${experiment_name}`);
    console.log(`Use cached results: ${use_cached}`);
    console.log(`Slack channel: ${channel}`);
    
    try {
        // Run the A/B test analysis
        const results = await runSmartScrollButtonExperiment({
            days_back,
            experiment_name,
            use_cached
        });
        
        // Generate Slack blocks
        const blocks = generateSlackBlocks(results, experiment_name, days_back);
        
        // Send to Slack
        console.log('📤 Sending report to Slack...');
        await sendSlackMessage(
            channel,
            "Here's your SmartScroll A/B test report! 🧪",
            blocks
        );
        
        console.log('✅ Successfully sent SmartScroll A/B test report to Slack!');
        return results;
        
    } catch (error) {
        console.error('❌ Error running SmartScroll A/B test Slack report:', error);
        throw error;
    }
}

// Allow running directly from command line
if (require.main === module) {
    const args = process.argv.slice(2);
    let daysBack = 7;
    let experimentName = 'smartscroll_button_variant';
    let useCached = false;
    let channel = '#proj-mula-reports';
    
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
        } else if (arg === '--channel' && i + 1 < args.length) {
            channel = args[i + 1];
            i++; // Skip next argument
        } else if (arg === '--help' || arg === '-h') {
            console.log(`
SmartScroll A/B Test Slack Report

Usage: node smartscroll-ab-test-slack-report.js [options]

Options:
  --use-cached, --cached     Use cached results instead of running new query
  --days-back <number>       Number of days to look back (default: 7)
  --experiment <name>        Experiment name (default: 'smartscroll_button_variant')
  --channel <channel>        Slack channel (default: '#proj-mula-reports')
  --help, -h                 Show this help message

Examples:
  node smartscroll-ab-test-slack-report.js
  node smartscroll-ab-test-slack-report.js --use-cached
  node smartscroll-ab-test-slack-report.js --days-back 14
  node smartscroll-ab-test-slack-report.js --channel '#my-channel'
            `);
            process.exit(0);
        }
    }
    
    runSmartScrollABTestSlackReport({ 
        days_back: daysBack, 
        experiment_name: experimentName,
        use_cached: useCached,
        channel: channel
    })
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Failed to run SmartScroll A/B test Slack report:', error);
            process.exit(1);
        });
}

module.exports = { runSmartScrollABTestSlackReport }; 