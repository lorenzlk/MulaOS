#!/usr/bin/env node

/**
 * September 11, 2025 Anomaly Analysis Runner
 * 
 * This script analyzes the 10x spike in mula_store_click events on September 11, 2025
 * by running three related queries:
 * 1. Daily comparison analysis
 * 2. Hourly breakdown for September 11th
 * 3. Top products clicked on September 11th
 */

const { executeQuery } = require('../utils/query-runner');
const csv = require('csv-parser');
const path = require('path');
const fs = require('fs').promises;

/**
 * Parse CSV content from Athena query results
 * @param {string} csvContent - Raw CSV content
 * @returns {Array} - Parsed data as array of objects
 */
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
  }
  
  return data;
}

/**
 * Read CSV file from S3 output location
 * @param {string} outputLocation - S3 path to CSV file
 * @returns {Array} - Parsed CSV data
 */
async function readCSVFromS3(outputLocation) {
  // Extract timestamp and query execution ID from S3 path
  const pathParts = outputLocation.split('/');
  const queryName = pathParts[pathParts.length - 2];
  const timestamp = pathParts[pathParts.length - 3];
  const queryExecutionId = pathParts[pathParts.length - 1].replace('.csv', '');
  
  // Construct local file path
  const localFilePath = path.join(__dirname, '..', '..', 'data', 'athena-results', queryName, timestamp, `${queryExecutionId}.csv`);
  
  try {
    const csvContent = await fs.readFile(localFilePath, 'utf8');
    return parseCSV(csvContent);
  } catch (error) {
    console.error(`Error reading CSV file: ${localFilePath}`, error);
    return [];
  }
}

async function runAnomalyAnalysis() {
  console.log('🔍 Starting September 11, 2025 Anomaly Analysis...\n');

  try {
    // Query 1: Daily comparison analysis
    console.log('📊 Running daily comparison analysis...');
    const dailyResult = await executeQuery('september-11-anomaly-analysis');
    
    if (dailyResult.success) {
      const dailyData = await readCSVFromS3(dailyResult.outputLocation);
      console.log('\n📈 Daily Comparison Results:');
      console.log('Host | Anomaly Day Clicks | Normal Avg | Normal Max | Multiplier vs Avg | Multiplier vs Max');
      console.log('-----|-------------------|------------|------------|-------------------|------------------');
      
      dailyData.forEach(row => {
        const host = row.host || 'Unknown';
        const anomalyClicks = row.anomaly_day_clicks || '0';
        const normalAvg = row.normal_avg_clicks || '0';
        const normalMax = row.normal_max_clicks || '0';
        const multiplierAvg = row.multiplier_vs_avg || 'N/A';
        const multiplierMax = row.multiplier_vs_max || 'N/A';
        
        console.log(`${host.padEnd(20)} | ${anomalyClicks.padEnd(17)} | ${normalAvg.padEnd(10)} | ${normalMax.padEnd(10)} | ${multiplierAvg.toString().padEnd(17)} | ${multiplierMax.toString()}`);
      });
    }

    // Query 2: Hourly breakdown
    console.log('\n⏰ Running hourly breakdown analysis...');
    const hourlyResult = await executeQuery('september-11-hourly-breakdown');
    
    if (hourlyResult.success) {
      const hourlyData = await readCSVFromS3(hourlyResult.outputLocation);
      console.log('\n🕐 Hourly Breakdown for September 11, 2025:');
      
      // Group by host for better display
      const hostGroups = {};
      hourlyData.forEach(row => {
        const host = row.host || 'Unknown';
        if (!hostGroups[host]) {
          hostGroups[host] = [];
        }
        hostGroups[host].push({
          hour: row.hour,
          clicks: parseInt(row.click_count) || 0
        });
      });

      Object.keys(hostGroups).forEach(host => {
        console.log(`\n📱 ${host}:`);
        hostGroups[host]
          .sort((a, b) => a.hour.localeCompare(b.hour))
          .forEach(item => {
            console.log(`  ${item.hour}: ${item.clicks} clicks`);
          });
      });
    }

    // Query 3: Top products
    console.log('\n🛍️ Running top products analysis...');
    const productsResult = await executeQuery('september-11-top-products');
    
    if (productsResult.success) {
      const productsData = await readCSVFromS3(productsResult.outputLocation);
      console.log('\n🏆 Top Products Clicked on September 11, 2025:');
      
      // Group by host and show top 10 products per host
      const hostProducts = {};
      productsData.forEach(row => {
        const host = row.host || 'Unknown';
        if (!hostProducts[host]) {
          hostProducts[host] = [];
        }
        hostProducts[host].push({
          productId: row.product_id,
          pageUrl: row.page_url,
          clicks: parseInt(row.click_count) || 0
        });
      });

      Object.keys(hostProducts).forEach(host => {
        console.log(`\n📱 ${host} - Top Products:`);
        hostProducts[host]
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 10)
          .forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.productId} (${item.clicks} clicks) - ${item.pageUrl}`);
          });
      });
    }

    console.log('\n✅ Analysis complete!');
    console.log('\n💡 Key Insights:');
    console.log('- Check the multiplier columns to see which hosts had the biggest spikes');
    console.log('- Review the hourly breakdown to identify when the anomaly occurred');
    console.log('- Examine the top products to understand what drove the increased clicks');

  } catch (error) {
    console.error('❌ Error running anomaly analysis:', error);
    process.exit(1);
  }
}

// Run the analysis
runAnomalyAnalysis();
