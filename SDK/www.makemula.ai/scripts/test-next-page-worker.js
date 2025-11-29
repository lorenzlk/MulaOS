#!/usr/bin/env node

/**
 * Test script to run nextPageBuildWorker with actual CSV data
 * Usage: node scripts/test-next-page-worker.js
 */

require('dotenv').config();
const NextPageBuildWorker = require('../workers/nextPageBuildWorker');

async function testNextPageWorker() {
  console.log('🧪 Testing NextPageBuildWorker with actual data...\n');

  // Create a mock job with the data we know works
  const mockJob = {
    data: {
      domain: 'www.on3.com',
      lookbackDays: 7,
      categoryOrPath: '/teams/michigan-wolverines',
      limit: 5,
      channelId: 'test-channel',
      channelName: 'Test Channel'
    }
  };

  try {
    // Initialize the worker
    const worker = new NextPageBuildWorker();
    await worker.init();

    console.log('✅ Worker initialized');
    console.log('📊 Processing job with data:');
    console.log(`   Domain: ${mockJob.data.domain}`);
    console.log(`   Lookback: ${mockJob.data.lookbackDays} days`);
    console.log(`   Path: ${mockJob.data.categoryOrPath}`);
    console.log(`   Limit: ${mockJob.data.limit}`);
    console.log('');

    // Process the job
    console.log('⏳ Processing job...');
    
    // Let's manually run through the process to save a local copy
    const { domain, lookbackDays, categoryOrPath, limit } = mockJob.data;
    
    // Execute the query
    const { executeQuery } = require('../queries/utils/query-runner');
    const queryResult = await executeQuery('next-page-recommendations', {
      parameters: {
        domain,
        days_back: lookbackDays,
        category_or_path: categoryOrPath,
        limit
      }
    });

    if (!queryResult.success) {
      throw new Error(`Query execution failed: ${queryResult.error}`);
    }

    // Read the CSV results
    const fs = require('fs').promises;
    const path = require('path');
    
    const timestamp = queryResult.outputLocation.split('/').slice(-2, -1)[0];
    const localFilePath = path.join(__dirname, '..', 'data', 'athena-results', 'next-page-recommendations', timestamp, `${queryResult.queryExecutionId}.csv`);
    
    const csvContent = await fs.readFile(localFilePath, 'utf8');
    const pathnames = worker.parseCSV(csvContent);

    console.log(`📊 Found ${pathnames.length} popular articles, crawling for metadata...`);

    // Crawl URLs to extract metadata
    const nextPageItems = [];
    for (const pathData of pathnames) {
      // Construct full URL from domain and pathname
      const fullUrl = `https://${domain}${pathData.pathname}`;
      console.log(`🕷️  Crawling: ${fullUrl}`);
      const metadata = await worker.crawlUrl(fullUrl);
      
      if (metadata && metadata.title) {
        nextPageItems.push({
          imageUrl: metadata.imageUrl || null,
          title: metadata.title,
          url: fullUrl
        });
        console.log(`   ✅ ${metadata.title}`);
      } else {
        console.log(`   ❌ Failed to extract metadata`);
      }
    }

    if (nextPageItems.length === 0) {
      console.log('❌ No valid articles found after crawling');
      return;
    }

    // Save local copy of manifest
    const localManifestPath = path.join(__dirname, '..', 'data', 'next-page-manifest.json');
    await fs.writeFile(localManifestPath, JSON.stringify(nextPageItems, null, 2));
    console.log(`💾 Saved local manifest to: ${localManifestPath}`);

    // Show the manifest
    console.log('\n📄 Generated manifest:');
    console.log(JSON.stringify(nextPageItems, null, 2));

    console.log('✅ Job processing completed!');

  } catch (error) {
    console.error('❌ Error testing worker:', error);
  } finally {
    // Cleanup
    const worker = new NextPageBuildWorker();
    await worker.cleanup();
  }
}

// Run the test
testNextPageWorker().catch(console.error);
