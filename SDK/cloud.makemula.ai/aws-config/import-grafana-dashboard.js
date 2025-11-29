const https = require('https');
const fs = require('fs');

// Grafana workspace details
const GRAFANA_ENDPOINT = 'g-e844782f82.grafana-workspace.us-east-1.amazonaws.com';
const WORKSPACE_ID = 'g-e844782f82';

// Read the dashboard configuration
const dashboardConfig = JSON.parse(fs.readFileSync('./search-phrase-dashboard.json', 'utf8'));

// Create API key for Grafana
const createApiKey = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      name: 'mula-dashboard-key',
      role: 'Admin',
      secondsToLive: 86400 // 24 hours
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
            console.log('✅ Dashboard imported successfully!');
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
    console.log('🔑 Creating Grafana API key...');
    const apiKey = await createApiKey();
    console.log('✅ API key created');

    console.log('📊 Importing dashboard...');
    await importDashboard(apiKey);
    
    console.log('\n🎉 Dashboard setup complete!');
    console.log(`Visit: https://${GRAFANA_ENDPOINT}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

main();
