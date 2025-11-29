#!/usr/bin/env node

const AWS = require('aws-sdk');
const https = require('https');

// Configuration
const GRAFANA_URL = 'https://g-e844782f82.grafana-workspace.us-east-1.amazonaws.com';
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY || "";
const DASHBOARD_UID = 'aez8t5wxrwkqof';

// Configure AWS
AWS.config.update({ region: 'us-east-1' });
const cloudwatch = new AWS.CloudWatch({ profile: 'kdmny30' });

async function getSearchPhrases() {
  try {
    const result = await cloudwatch.listMetrics({
      Namespace: 'Mula/SearchPhrases',
      MetricName: 'SearchPhraseCount'
    }).promise();
    
    return result.Metrics.map(metric => ({
      host: metric.Dimensions.find(d => d.Name === 'Host')?.Value,
      searchPhrase: metric.Dimensions.find(d => d.Name === 'SearchPhrase')?.Value
    })).filter(item => item.host && item.searchPhrase);
  } catch (error) {
    console.error('Error fetching search phrases:', error);
    return [];
  }
}

async function getDashboard() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'g-e844782f82.grafana-workspace.us-east-1.amazonaws.com',
      port: 443,
      path: `/api/dashboards/uid/${DASHBOARD_UID}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GRAFANA_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function updateDashboard(dashboard, searchPhrases) {
  return new Promise((resolve, reject) => {
    // Create panels for each search phrase
    const panels = searchPhrases.map((phrase, index) => ({
      id: index + 1,
      title: `${phrase.searchPhrase} (${phrase.host})`,
      type: 'stat',
      targets: [{
        datasource: {
          type: 'cloudwatch',
          uid: 'cloudwatch'
        },
        namespace: 'Mula/SearchPhrases',
        metricName: 'SearchPhraseCount',
        dimensions: {
          Host: phrase.host,
          SearchPhrase: phrase.searchPhrase
        },
        statistic: 'Sum',
        period: '300',
        refId: String.fromCharCode(65 + index), // A, B, C, etc.
        region: 'us-east-1'
      }],
      gridPos: {
        h: 6,
        w: 6,
        x: (index % 4) * 6,
        y: Math.floor(index / 4) * 6
      },
      options: {
        colorMode: 'value',
        graphMode: 'area',
        justifyMode: 'auto',
        orientation: 'auto',
        reduceOptions: {
          calcs: ['lastNotNull'],
          fields: '',
          values: false
        },
        textMode: 'auto'
      }
    }));

    // Update dashboard
    const updatedDashboard = {
      ...dashboard.dashboard,
      panels: panels,
      version: dashboard.dashboard.version + 1
    };

    const options = {
      hostname: 'g-e844782f82.grafana-workspace.us-east-1.amazonaws.com',
      port: 443,
      path: '/api/dashboards/db',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GRAFANA_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('Dashboard updated successfully:', result);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ dashboard: updatedDashboard }));
    req.end();
  });
}

async function main() {
  try {
    console.log('Fetching search phrases...');
    const searchPhrases = await getSearchPhrases();
    console.log(`Found ${searchPhrases.length} search phrases:`, searchPhrases);

    console.log('Fetching current dashboard...');
    const dashboard = await getDashboard();

    console.log('Updating dashboard...');
    await updateDashboard(dashboard, searchPhrases);

    console.log('✅ Dashboard updated successfully!');
    console.log(`📊 View at: ${GRAFANA_URL}/d/${DASHBOARD_UID}/mula-search-phrases-working-tiles`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getSearchPhrases, updateDashboard };
