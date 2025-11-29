#!/usr/bin/env node

const https = require('https');

// Grafana workspace details
const GRAFANA_ENDPOINT = 'g-e844782f82.grafana-workspace.us-east-1.amazonaws.com';

// For AWS Managed Grafana, you need to authenticate via AWS SSO or IAM
// This script will help you create a new API key, but you'll need to authenticate first

console.log('🔑 Creating new Grafana API key...');
console.log('');
console.log('For AWS Managed Grafana, you have a few options:');
console.log('');
console.log('1. AWS Console Method (Recommended):');
console.log('   - Go to: https://console.aws.amazon.com/grafana/home?region=us-east-1');
console.log('   - Click on your workspace: g-e844782f82');
console.log('   - Go to "Authentication" tab');
console.log('   - Create a new API key with Admin role');
console.log('');
console.log('2. AWS CLI Method:');
console.log('   - Run: aws grafana create-workspace-api-key \\');
console.log('     --workspace-id g-e844782f82 \\');
console.log('     --key-name "mula-dashboard-key" \\');
console.log('     --key-role ADMIN \\');
console.log('     --seconds-to-live 86400');
console.log('');
console.log('3. Manual API Method (if you have admin access):');
console.log('   - Log into Grafana UI');
console.log('   - Go to Configuration > API Keys');
console.log('   - Create new key with Admin role');
console.log('');

// If you want to try the API method, uncomment this section:
/*
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
*/

console.log('Once you have a new API key, update the GRAFANA_API_KEY in:');
console.log('- import-realtime-traffic-dashboard.js');
console.log('- update-grafana-dashboard.js');
console.log('- Any other scripts that use the API key');

