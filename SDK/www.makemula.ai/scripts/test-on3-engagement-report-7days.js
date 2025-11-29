#!/usr/bin/env node

require('dotenv').config();
const { executeQuery } = require('../queries/utils/query-runner');
const { sendSlackMessage } = require('../helpers/SlackHelpers');

async function testOn3EngagementReport7Days() {
  console.log('🧪 Testing Engagement Report for on3.com (7 days)...\n');
  
  try {
    // Test with on3.com domain and 7-day lookback
    const result = await executeQuery('engagement-report', {
      parameters: {
        domain: 'www.on3.com',
        days_back: 7
      }
    });
    
    console.log('✅ Query executed successfully!');
    console.log('Query Execution ID:', result.queryExecutionId);
    console.log('Output Location:', result.outputLocation);
    console.log('Execution Time:', result.executionTime, 'ms');
    console.log('Data Scanned:', result.dataScanned, 'bytes');
    
    if (result.data) {
      console.log('\n📊 Query Results:');
      console.log(result.data);
      
      // Parse and format the results for Slack
      const data = parseCSV(result.data);
      
      if (data.length > 0) {
        // Process the results into cohorts
        const mulaNotShown = data.find(row => row.cohort === 'mula_not_shown');
        const mulaShown = data.find(row => row.cohort === 'mula_shown');
        
        if (mulaNotShown && mulaShown) {
          // Format the report for Slack
          const reportMessage = formatEngagementReport('www.on3.com', 7, mulaNotShown, mulaShown);
          
          // Send to default Slack channel
          const defaultChannel = process.env.DEFAULT_SLACK_CHANNEL || 'proj-mula-notifications';
          console.log(`\n📤 Sending results to Slack channel: ${defaultChannel}`);
          
          await sendSlackMessage(defaultChannel, `🧪 Test Engagement Report: www.on3.com (7 days)`, reportMessage);
          console.log('✅ Results sent to Slack successfully!');
        } else {
          console.log('⚠️  Insufficient data to compare cohorts');
          console.log('Available data:', data);
        }
      } else {
        console.log('📊 No data returned (this might be expected for test domain)');
      }
    } else {
      console.log('\n📊 No data returned (this might be expected for test domain)');
    }
    
  } catch (error) {
    console.error('❌ Query failed:', error);
  }
}

/**
 * Parse CSV data from Athena query results
 * @param {string} csvContent - CSV content from Athena
 * @returns {Array} Parsed data rows
 */
function parseCSV(csvContent) {
  if (!csvContent) return [];
  
  const [headerLine, ...rows] = csvContent.trim().split('\n');
  const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  return rows.map(row => {
    const values = row.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    return Object.fromEntries(values.map((val, i) => [headers[i], val]));
  });
}

/**
 * Format engagement report for Slack
 * @param {string} domain - Domain analyzed
 * @param {number} lookbackDays - Lookback period
 * @param {Object} mulaNotShown - Data for sessions without Mula
 * @param {Object} mulaShown - Data for sessions with Mula
 * @returns {Array} Slack message blocks
 */
function formatEngagementReport(domain, lookbackDays, mulaNotShown, mulaShown) {
  const formatTime = (seconds) => {
    const secs = Math.round(parseFloat(seconds) || 0);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  const formatScroll = (pixels) => {
    const px = Math.round(parseFloat(pixels) || 0);
    if (px < 1000) return `${px}px`;
    return `${(px / 1000).toFixed(1)}kpx`;
  };

  const formatLift = (liftPercent) => {
    const lift = parseFloat(liftPercent) || 0;
    if (lift === 0) return '0%';
    const sign = lift > 0 ? '+' : '';
    return `${sign}${lift.toFixed(1)}%`;
  };

  const getSignificanceEmoji = (pValue) => {
    if (!pValue) return '';
    if (pValue === '< 0.01') return ' ⭐';
    if (pValue === '< 0.05') return ' ✨';
    return '';
  };

  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `🧪 Test Engagement Report: ${domain}`,
        emoji: true
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Period: ${lookbackDays} days | Generated: ${new Date().toLocaleString()} | *TEST RUN*`
        }
      ]
    },
    {
      type: 'divider'
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `🔴 *NO MULA SHOWN (${mulaNotShown.sessions} sessions)*\n• Time on page: ${formatTime(mulaNotShown.avg_time_on_page)} avg, ${formatTime(mulaNotShown.median_time_on_page)} median\n• Scroll depth: ${formatScroll(mulaNotShown.avg_scroll_depth)} avg, ${formatScroll(mulaNotShown.median_scroll_depth)} median`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `🟢 *MULA SHOWN (${mulaShown.sessions} sessions)*\n• Time on page: ${formatTime(mulaShown.avg_time_on_page)} avg, ${formatTime(mulaShown.median_time_on_page)} median\n• Scroll depth: ${formatScroll(mulaShown.avg_scroll_depth)} avg, ${formatScroll(mulaShown.median_scroll_depth)} median`
      }
    },
    {
      type: 'divider'
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `📈 *LIFT ANALYSIS*\n• Time on page: ${formatLift(mulaShown.time_lift_percent)} (p ${mulaShown.time_p_value || 'N/A'})${getSignificanceEmoji(mulaShown.time_p_value)}\n• Scroll depth: ${formatLift(mulaShown.scroll_lift_percent)} (p ${mulaShown.scroll_p_value || 'N/A'})${getSignificanceEmoji(mulaShown.scroll_p_value)}`
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Statistical significance: ${mulaShown.time_p_value && mulaShown.scroll_p_value ? 'Both metrics show significant differences' : 'Insufficient data for statistical significance'}`
        }
      ]
    }
  ];
}

// Run the test
if (require.main === module) {
  testOn3EngagementReport7Days();
}

module.exports = { testOn3EngagementReport7Days };
