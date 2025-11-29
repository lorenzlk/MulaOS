#!/usr/bin/env node

/**
 * Standalone Revenue Collection Worker
 * 
 * Runs just the revenue collection worker for testing/debugging.
 * In production, this is handled by the main worker.js file.
 * 
 * Usage:
 *   node scripts/run-revenue-worker.js
 */

require('dotenv').config();

console.log('🚀 Starting Revenue Collection Worker...');
console.log('   This worker will process revenue collection jobs from the queue.');
console.log('   Press Ctrl+C to stop.\n');

// Require the worker to initialize it
require('../workers/revenueCollectionWorker');

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down revenue collection worker...');
  process.exit(0);
});

// Keep process alive
setInterval(() => {
  // Just keep the process running
}, 1000);

