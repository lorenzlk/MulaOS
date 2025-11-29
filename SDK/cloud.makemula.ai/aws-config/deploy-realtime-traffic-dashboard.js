const fs = require('fs');
const path = require('path');

// Load the dashboard configuration
const dashboardPath = path.join(__dirname, 'grafana-dashboard-realtime-traffic.json');
const dashboardConfig = JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));

// This script can be used with the existing import-grafana-dashboard.js
// or run directly with Node.js to deploy the dashboard

console.log('Real-Time Traffic Dashboard Configuration:');
console.log('==========================================');
console.log(`Title: ${dashboardConfig.dashboard.title}`);
console.log(`Tags: ${dashboardConfig.dashboard.tags.join(', ')}`);
console.log(`Panels: ${dashboardConfig.dashboard.panels.length}`);
console.log(`Refresh Rate: ${dashboardConfig.dashboard.refresh}`);
console.log(`Time Range: ${dashboardConfig.dashboard.time.from} to ${dashboardConfig.dashboard.time.to}`);

console.log('\nDashboard Panels:');
console.log('==================');
dashboardConfig.dashboard.panels.forEach((panel, index) => {
  console.log(`${index + 1}. ${panel.title} (${panel.type})`);
});

console.log('\nTo deploy this dashboard:');
console.log('1. Make sure your Grafana workspace is set up');
console.log('2. Run: node import-grafana-dashboard.js grafana-dashboard-realtime-traffic.json');
console.log('3. Or use the AWS CLI to create the dashboard in CloudWatch');

// Export the dashboard config for use with other scripts
module.exports = dashboardConfig;

