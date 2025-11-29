#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// Grafana workspace details
const GRAFANA_ENDPOINT = 'g-e844782f82.grafana-workspace.us-east-1.amazonaws.com';
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY || "";

// Read the dashboard configuration
const dashboardConfig = JSON.parse(fs.readFileSync('./grafana-dashboard-realtime-traffic-fixed.json', 'utf8'));

// Import dashboard
const importDashboard = (apiKey) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(dashboardConfig);

    const options = {
      hostname: GRAFANA_ENDPOINT,
      port: 443,
      path: '/api/dashboards/db',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${apiKey}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.id) {
            console.log('✅ Fixed Real-Time Traffic Dashboard imported successfully!');
            console.log(`Dashboard ID: ${response.id}`);
            console.log(`Dashboard URL: https://${GRAFANA_ENDPOINT}/d/${response.slug}`);
            resolve(response);
          } else {
            reject(new Error('Failed to import dashboard: ' + data));
          }
        } catch (e) {
          reject(new Error('Invalid JSON response: ' + data));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
};

// Main execution
const main = async () => {
  try {
    console.log('📊 Importing Fixed Real-Time Traffic Dashboard...');
    console.log('This dashboard uses the correct metric names:');
    console.log('- AWS/Kinesis metrics for overall traffic');
    console.log('- Mula/SearchPhrases/SearchPhraseCount for host-specific data');
    console.log('');
    
    await importDashboard(GRAFANA_API_KEY);
    
    console.log('\n🎉 Fixed dashboard setup complete!');
    console.log(`Visit: https://${GRAFANA_ENDPOINT}`);
    console.log('\nDashboard Features:');
    console.log('- Real-time traffic from Kinesis stream');
    console.log('- Individual host traffic (on3.com, brit.co, swimmingworldmagazine.com)');
    console.log('- Data throughput monitoring');
    console.log('- Kinesis performance metrics');
    console.log('- 5-second refresh rate for live updates');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

main();

