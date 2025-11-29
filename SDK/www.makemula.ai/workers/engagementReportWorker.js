require('dotenv').config();
const { executeQuery } = require('../queries/utils/query-runner');
const { sendSlackMessage } = require('../helpers/SlackHelpers.js');
const path = require('path');

/**
 * Generate engagement report comparing sessions with/without Mula
 * @param {Object} job - Bull job object
 * @param {string} job.data.domain - Domain to analyze
 * @param {number} job.data.lookbackDays - Number of days to look back
 * @param {string} job.data.channelId - Slack channel ID to send results to
 * @param {string} job.data.channelName - Slack channel name for display
 */
async function generateEngagementReport(job) {
  const { domain, lookbackDays, channelId, channelName } = job.data;
  
  console.log('🚀 Starting engagement report generation:', {
    domain,
    lookbackDays,
    channelId,
    channelName
  });

  try {
    // Execute the engagement report query
    console.log('📊 Executing engagement report query...');
    const result = await executeQuery('engagement-report', {
      parameters: {
        domain: domain,
        days_back: lookbackDays
      }
    });

    if (!result || !result.outputLocation) {
      throw new Error('No output location returned from query');
    }

    console.log('✅ Query completed, processing results...');
    
    // Extract timestamp from output location and construct local file path
    const timestamp = result.outputLocation.split('/').slice(-2, -1)[0];
    const localFilePath = path.join(__dirname, '..', 'data', 'athena-results', 'engagement-report', timestamp, `${result.queryExecutionId}.csv`);
    
    console.log('📁 Reading CSV from local file:', localFilePath);
    
    // Read the CSV file manually (executeQuery only downloads, doesn't return content)
    const fs = require('fs').promises;
    const csvContent = await fs.readFile(localFilePath, 'utf8');
    
    // Parse the CSV results
    const data = parseCSV(csvContent);
    
    if (data.length === 0) {
      throw new Error('No data found for the specified domain and time period');
    }

    // Process the results into cohorts
    const mulaNotShown = data.find(row => row.cohort === 'mula_not_shown');
    const mulaShown = data.find(row => row.cohort === 'mula_shown');

    if (!mulaNotShown || !mulaShown) {
      throw new Error('Insufficient data to compare cohorts');
    }

    // Format the report for Slack
    const reportMessage = formatEngagementReport(domain, lookbackDays, mulaNotShown, mulaShown);
    
    // Send to Slack
    console.log('📤 Sending report to Slack...');
    await sendSlackMessage(channelId, `Engagement Report: ${domain}`, reportMessage);
    
    console.log('✅ Engagement report completed successfully');
    
  } catch (error) {
    console.error('❌ Error generating engagement report:', error);
    
    // Send error message to Slack
    const errorMessage = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `❌ *Engagement Report Failed*\n\n*Domain:* ${domain}\n*Period:* ${lookbackDays} days\n*Error:* ${error.message}`
        }
      }
    ];
    
    try {
      await sendSlackMessage(channelId, 'Engagement Report Error', errorMessage);
    } catch (slackError) {
      console.error('Failed to send error message to Slack:', slackError);
    }
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
        text: `📊 Engagement Report: ${domain}`,
        emoji: true
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Period: ${lookbackDays} day${lookbackDays !== 1 ? 's' : ''} | Generated: ${new Date().toLocaleString()}`
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

// Export the main function
module.exports = {
  generateEngagementReport
};
