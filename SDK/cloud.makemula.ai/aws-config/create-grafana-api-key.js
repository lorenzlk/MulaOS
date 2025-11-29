#!/usr/bin/env node

const https = require('https');

// Grafana workspace details
const GRAFANA_ENDPOINT = 'g-e844782f82.grafana-workspace.us-east-1.amazonaws.com';

// Create API key for Grafana
const createApiKey = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      name: 'mula-dashboard-key-' + Date.now(),
      role: 'Admin',
      secondsToLive: 86400 * 7 // 7 days
    });

    const options = {
      hostname: GRAFANA_ENDPOINT,
      port: 443,
      path: '/api/auth/keys',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
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
          if (response.key) {
            console.log('✅ New API key created successfully!');
            console.log('🔑 API Key:', response.key);
            console.log('📝 Name:', response.name);
            console.log('⏰ Expires:', new Date(response.expiration).toISOString());
            resolve(response.key);
          } else {
            reject(new Error('Failed to create API key: ' + data));
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

async function main() {
  try {
    console.log('Creating new Grafana API key...');
    const apiKey = await createApiKey();
    console.log('\n📋 Update your script with this API key:');
    console.log(`const GRAFANA_API_KEY = '${apiKey}';`);
  } catch (error) {
    console.error('❌ Error creating API key:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createApiKey };
