#!/usr/bin/env node

const { executeQuery, listQueries, getQueryMetadata } = require('./utils/query-runner');
const scheduler = require('./utils/scheduler');

/**
 * Display help information
 */
function showHelp() {
    console.log(`
Mula Athena Queries CLI

Usage: node cli.js <command> [options]

Commands:
  list                    List all available queries
  info <query>           Show information about a specific query
  run <query> [options]  Run a specific query
  schedule <command>     Manage scheduled queries
  help                   Show this help message

Query Options:
  --days-back <number>        Number of days to look back (for applicable queries)
  --output-location <path>    S3 output location
  --parameters <json>         JSON string of parameters

Schedule Commands:
  start                     Start all scheduled jobs
  stop                      Stop all scheduled jobs
  list                      List active scheduled jobs
  create <name> <cron> <query>  Create a new schedule
  delete <name>             Delete a schedule
  run-now <query>           Run a query immediately

Examples:
  node cli.js list
  node cli.js info store-clicks
  node cli.js run store-clicks --days-back 7
  node cli.js schedule start
  node cli.js schedule create daily-store-clicks "0 9 * * *" store-clicks
  node cli.js schedule run-now store-clicks
    `);
}

/**
 * Parse command line arguments
 * @param {Array} args - Command line arguments
 * @returns {Object} - Parsed command and options
 */
function parseArgs(args) {
    if (args.length === 0) {
        return { command: 'help' };
    }
    
    const command = args[0];
    const options = {};
    
    // Parse options
    for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--days-back' && i + 1 < args.length) {
            options.days_back = parseInt(args[i + 1]);
            i++;
        } else if (arg === '--output-location' && i + 1 < args.length) {
            options.output_location = args[i + 1];
            i++;
        } else if (arg === '--parameters' && i + 1 < args.length) {
            try {
                options.parameters = JSON.parse(args[i + 1]);
            } catch (error) {
                console.error('Invalid JSON parameters:', error.message);
                process.exit(1);
            }
            i++;
        } else if (arg === '--help' || arg === '-h') {
            return { command: 'help' };
        } else if (!arg.startsWith('--')) {
            // This is a positional argument
            if (!options.query) {
                options.query = arg;
            } else if (!options.name) {
                options.name = arg;
            } else if (!options.cron) {
                options.cron = arg;
            }
        }
    }
    
    return { command, options };
}

/**
 * List all available queries
 */
async function listQueriesCommand() {
    try {
        const queries = await listQueries();
        
        console.log('Available Queries:');
        console.log('==================');
        
        for (const query of queries) {
            const metadata = await getQueryMetadata(query);
            console.log(`\n${query}:`);
            console.log(`  Description: ${metadata.description}`);
            console.log(`  Parameters: ${metadata.parameters}`);
            console.log(`  Output: ${metadata.output}`);
        }
    } catch (error) {
        console.error('Error listing queries:', error);
        process.exit(1);
    }
}

/**
 * Show information about a specific query
 * @param {string} queryName - Name of the query
 */
async function infoCommand(queryName) {
    try {
        const metadata = await getQueryMetadata(queryName);
        
        console.log(`Query Information: ${queryName}`);
        console.log('==============================');
        console.log(`Description: ${metadata.description}`);
        console.log(`Parameters: ${metadata.parameters}`);
        console.log(`Output: ${metadata.output}`);
        
        // Show the actual query
        const { loadQuery } = require('./utils/query-runner');
        const query = await loadQuery(queryName);
        console.log('\nQuery:');
        console.log('------');
        console.log(query);
        
    } catch (error) {
        console.error(`Error getting query info for ${queryName}:`, error);
        process.exit(1);
    }
}

/**
 * Run a specific query
 * @param {string} queryName - Name of the query
 * @param {Object} options - Query options
 */
async function runCommand(queryName, options) {
    try {
        console.log(`Running query: ${queryName}`);
        console.log('=======================');
        
        // Merge days_back and output_location into parameters
        const parameters = {
            ...(options.parameters || {}),
            days_back: options.days_back !== undefined ? options.days_back : (options.parameters?.days_back || 1)
        };
        
        const result = await executeQuery(queryName, {
            parameters,
            output_location: options.output_location
        });
        
        console.log('\nQuery completed successfully!');
        console.log(`Query Execution ID: ${result.queryExecutionId}`);
        console.log(`Output Location: ${result.outputLocation}`);
        console.log(`Execution Time: ${result.executionTime}ms`);
        console.log(`Data Scanned: ${result.dataScanned} bytes`);
        
    } catch (error) {
        console.error(`Error running query ${queryName}:`, error);
        process.exit(1);
    }
}

/**
 * Handle schedule commands
 * @param {string} subCommand - Schedule sub-command
 * @param {Object} options - Command options
 */
async function scheduleCommand(subCommand, options) {
    try {
        switch (subCommand) {
            case 'start':
                await scheduler.startAll();
                break;
                
            case 'stop':
                scheduler.stopAll();
                break;
                
            case 'list':
                const jobs = scheduler.listJobs();
                console.log('Active Scheduled Jobs:');
                console.log('======================');
                for (const job of jobs) {
                    console.log(`${job.name}: ${job.running ? 'Running' : 'Stopped'} (Next: ${job.nextRun})`);
                }
                break;
                
            case 'create':
                if (!options.name || !options.cron || !options.query) {
                    console.error('Missing required arguments for schedule create');
                    console.error('Usage: schedule create <name> <cron> <query>');
                    process.exit(1);
                }
                
                await scheduler.createSchedule({
                    name: options.name,
                    cron: options.cron,
                    query: options.query,
                    parameters: options.parameters || {},
                    output_location: options.output_location
                });
                break;
                
            case 'delete':
                if (!options.name) {
                    console.error('Missing schedule name for delete');
                    process.exit(1);
                }
                
                await scheduler.deleteSchedule(options.name);
                break;
                
            case 'run-now':
                if (!options.query) {
                    console.error('Missing query name for run-now');
                    process.exit(1);
                }
                
                await scheduler.runQueryNow(options.query, {
                    parameters: options.parameters || {},
                    output_location: options.output_location
                });
                break;
                
            default:
                console.error(`Unknown schedule command: ${subCommand}`);
                process.exit(1);
        }
    } catch (error) {
        console.error(`Error in schedule command ${subCommand}:`, error);
        process.exit(1);
    }
}

/**
 * Main CLI function
 */
async function main() {
    const args = process.argv.slice(2);
    const { command, options } = parseArgs(args);
    
    try {
        switch (command) {
            case 'list':
                await listQueriesCommand();
                break;
                
            case 'info':
                if (!options.query) {
                    console.error('Missing query name for info command');
                    process.exit(1);
                }
                await infoCommand(options.query);
                break;
                
            case 'run':
                if (!options.query) {
                    console.error('Missing query name for run command');
                    process.exit(1);
                }
                await runCommand(options.query, options);
                break;
                
            case 'schedule':
                const subCommand = args[1];
                if (!subCommand) {
                    console.error('Missing schedule sub-command');
                    process.exit(1);
                }
                await scheduleCommand(subCommand, options);
                break;
                
            case 'help':
            default:
                showHelp();
                break;
        }
    } catch (error) {
        console.error('CLI Error:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { main, parseArgs }; 