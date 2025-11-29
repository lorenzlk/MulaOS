#!/usr/bin/env node

require('dotenv').config();
const { processProductPerformance } = require('../workers/productPerformanceWorker');
const { createLogger } = require('../helpers/LoggingHelpers');

const logger = createLogger('TestProductPerformance');

async function testProductPerformance(days = 1) {
  try {
    logger.info('Starting product performance test', { days });
    
    // Run the product performance analysis
    await processProductPerformance(days);
    
    logger.info('Product performance test completed successfully', { days });
    
  } catch (error) {
    logger.error('Product performance test failed', error, { days });
    throw error;
  }
}

// Get days from command line argument
const days = parseInt(process.argv[2]) || 1;

if (days < 1 || days > 30) {
  console.error('Days must be between 1 and 30');
  process.exit(1);
}

console.log(`Testing product performance for the past ${days} day(s)...`);

testProductPerformance(days)
  .then(() => {
    console.log('✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }); 