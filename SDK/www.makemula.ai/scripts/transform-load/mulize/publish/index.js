// postTrendingPages.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const AWS = require('aws-sdk');
const { getPageURLs } = require('../../../../helpers/URLHelpers');
const { Page } = require('../../../../models');

const SLACK_TOKEN = process.env.SLACK_TOKEN;

// Domain to Slack channel mapping
const DOMAIN_TO_CHANNEL = {
  'defpen.com': 'proj-mula-defpen',
  // Add more mappings as needed
};

// Initialize S3 client
const s3 = new AWS.S3();

// Read and parse the CSV file from S3
async function parseCSV(s3Path) {
  return new Promise((resolve, reject) => {
    const results = [];
    const params = {
      Bucket: 'prod.makemula.ai',
      Key: s3Path.replace('s3://prod.makemula.ai/', '')
    };

    s3.getObject(params)
      .createReadStream()
      .pipe(csv())
      .on('data', (data) => {
        results.push({
          host: data.host,
          url: data.path,
          pageViews: parseInt(data.page_views, 10),
          percent: (parseFloat(data.percent_of_total) * 100).toFixed(2),
        });
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Transform data into Slack blocks
function buildSlackBlocks(grouped) {
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*📈 Mula found some trending articles. Should she curate product recs for them?*',
      },
    },
    { type: 'divider' },
  ];

  for (const [domain, pages] of Object.entries(grouped)) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🌐 Domain: \`${domain}\`*`,
      },
    });

    for (const page of pages) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<${page.url}|${page.url}>\n• *Views:* ${page.pageViews}  • *% of site traffic:* ${page.percent}%`,
        },
      });

      blocks.push({
        type: 'actions',
        elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Yes, Mulize this page' },
              style: 'primary',
              value: page.url,
              action_id: 'mulize_yes',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Not now' },
              value: page.url,
              action_id: 'mulize_not_now',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Forget forever' },
              style: 'danger',
              value: page.url,
              action_id: 'mulize_forget',
            },
          ],
      });
    }
  }

  return blocks;
}

// Post blocks to Slack
async function postToSlack(blocks, channel) {
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SLACK_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel,
      blocks,
      text: 'Trending articles detected by Mula',
    }),
  });

  const json = await res.json();
  if (!json.ok) {
    console.log(json);
    console.error('❌ Slack API error:', json.error);
  } else {
    console.log('✅ Message posted successfully:', json.ts);
  }
}

const name = "slack";
const run = async (dryRun = false) => {
  try {
    const s3Path = 's3://prod.makemula.ai/athena-results/1HourPageViewByHost/74b227f5-5bb0-4aa8-8096-f8f1fc88428a.csv';
    const rawData = await parseCSV(s3Path);

    // Process each URL and filter out ones that already have recommendations
    const processedData = [];
    for (const row of rawData) {
      const url = new URL(row.url);
      const page = await Page.findOne({ where: { url: url.toString() } });
      if (!page) {
        throw new Error(`Page not found for url: ${url.toString()}`);
      }
      
      const { mulaRecommendationsUrl } = await getPageURLs(page);
      
      // Check if recommendations file exists
      const s3Params = {
        Bucket: 'prod.makemula.ai',
        Key: mulaRecommendationsUrl.replace('https://cdn.makemula.ai/', '')
      };
      
      try {
        await s3.headObject(s3Params).promise();
        // If we get here, the file exists, so skip this row
        continue;
      } catch (error) {
        // If we get here, the file doesn't exist, so include this row
        processedData.push(row);
      }
    }

    // Group by host
    const grouped = {};
    for (const row of processedData) {
      if (!grouped[row.host]) grouped[row.host] = [];
      grouped[row.host].push(row);
    }

    // Post to appropriate channels based on domain
    for (const [domain, pages] of Object.entries(grouped)) {
      const channel = DOMAIN_TO_CHANNEL[domain];
      if (!channel) {
        console.warn(`No Slack channel mapping found for domain: ${domain}`);
        continue;
      }

      const blocks = buildSlackBlocks({ [domain]: pages });
      if (!dryRun) {
        await postToSlack(blocks, channel);
      } else {
        console.log(`Dry run - would have posted to channel ${channel}:`, JSON.stringify(blocks, null, 2));
      }
    }
  } catch (error) {
    console.error('Error in slack transform:', error);
    throw error;
  }
};

run();
