#!/usr/bin/env node

const { executeQuery } = require('../utils/query-runner');

/**
 * Parse command line arguments
 * @param {Array} args - Command line arguments
 * @returns {Object} - Parsed options
 */
function parseArgs(args) {
    const options = {
        days_back: 1,
        output_location: 's3://prod.makemula.ai/athena-results/store-clicks/'
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--days-back' && i + 1 < args.length) {
            options.days_back = parseInt(args[i + 1]);
            i++; // Skip next argument
        } else if (arg === '--output-location' && i + 1 < args.length) {
            options.output_location = args[i + 1];
            i++; // Skip next argument
        } else if (arg === '--help' || arg === '-h') {
            console.log(`
Store Clicks Query Runner

Usage: node store-clicks.js [options]

Options:
  --days-back <number>        Number of days to look back (default: 1)
  --output-location <path>    S3 output location (default: s3://prod.makemula.ai/athena-results/store-clicks/)
  --help, -h                  Show this help message

Examples:
  node store-clicks.js
  node store-clicks.js --days-back 7
  node store-clicks.js --days-back 1 --output-location s3://my-bucket/results/
            `);
            process.exit(0);
        }
    }
    
    return options;
}

/**
 * Main function to run the store clicks query
 */
async function main() {
    try {
        const args = process.argv.slice(2);
        const options = parseArgs(args);
        
        console.log('Store Clicks Query Runner');
        console.log('========================');
        console.log(`Days back: ${options.days_back}`);
        console.log(`Output location: ${options.output_location}`);
        console.log('');
        
        const result = await executeQuery('store-clicks', {
            parameters: {
                days_back: options.days_back
            },
            output_location: options.output_location
        });
        
        console.log('Query completed successfully!');
        console.log(`Query Execution ID: ${result.queryExecutionId}`);
        console.log(`Output Location: ${result.outputLocation}`);
        console.log(`Execution Time: ${result.executionTime}ms`);
        console.log(`Data Scanned: ${result.dataScanned} bytes`);
        
    } catch (error) {
        console.error('Error running store clicks query:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { main, parseArgs }; 