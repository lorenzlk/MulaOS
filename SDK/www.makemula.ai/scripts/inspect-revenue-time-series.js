#!/usr/bin/env node

/**
 * Inspect Revenue and RPM Time Series Data
 * 
 * Fetches and displays revenue/RPM time series data for a domain in nicely formatted JSON.
 * No Slack integration - just data inspection.
 * 
 * Usage:
 *   node scripts/inspect-revenue-time-series.js [domain] [lookbackDays]
 * 
 * Example:
 *   node scripts/inspect-revenue-time-series.js www.on3.com 7
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { executeQuery } = require('../queries/utils/query-runner');
const { RevenueDataService } = require('../services/RevenueDataService');
const models = require('../models');

// Parse CSV data
function parseCSV(csvContent) {
    const [headerLine, ...rows] = csvContent.trim().split('\n');
    const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
    return rows.map(row => {
        const values = row.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        return Object.fromEntries(values.map((val, i) => [headers[i], val]));
    });
}

// Fetch daily revenue and RPM time series data for a domain
async function fetchRevenueTimeSeries(domain, lookbackDays, timeSeriesData) {
    try {
        console.log(`📊 Fetching daily revenue data for ${domain}...`);
        const revenueService = new RevenueDataService(models);
        
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - lookbackDays);
        
        // Get revenue events grouped by date
        const revenueData = await revenueService.getRevenueData(domain, startDate, endDate);
        
        console.log(`   Found ${revenueData.events.length} revenue events`);
        console.log(`   Total revenue: $${revenueData.totalRevenue.toFixed(2)}`);
        console.log(`   Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`);
        
        // Group revenue by date
        const normalizeDate = (dateValue) => {
            if (dateValue instanceof Date) {
                return dateValue.toISOString().split('T')[0];
            }
            if (typeof dateValue === 'string') {
                // Handle dates with spaces (e.g., "2025-11-18 00:00:00.000")
                if (dateValue.includes(' ')) {
                    return dateValue.split(' ')[0];
                }
                // Handle ISO format with T (e.g., "2025-11-18T00:00:00.000Z")
                if (dateValue.includes('T')) {
                    return dateValue.split('T')[0];
                }
                // Handle formatted dates (e.g., "Nov 18, 2025")
                if (dateValue.includes(',')) {
                    return new Date(dateValue).toISOString().split('T')[0];
                }
                // Assume it's already YYYY-MM-DD format
                return dateValue;
            }
            return dateValue;
        };
        
        const revenueByDate = {};
        revenueData.events.forEach(event => {
            let dateStr;
            if (event.revenue_date instanceof Date) {
                dateStr = event.revenue_date.toISOString().split('T')[0];
            } else {
                dateStr = event.revenue_date.split('T')[0];
            }
            if (!revenueByDate[dateStr]) {
                revenueByDate[dateStr] = 0;
            }
            revenueByDate[dateStr] += parseFloat(event.revenue_amount);
        });
        
        // Merge revenue and RPM into time series data
        const viewsByDateAndHost = {};
        timeSeriesData.forEach(row => {
            const dateStr = normalizeDate(row.event_date);
            if (!viewsByDateAndHost[dateStr]) {
                viewsByDateAndHost[dateStr] = {};
            }
            if (!viewsByDateAndHost[dateStr][row.host]) {
                viewsByDateAndHost[dateStr][row.host] = 0;
            }
            viewsByDateAndHost[dateStr][row.host] += parseInt(row.smartscroll_in_views || 0);
        });
        
        // Add revenue and RPM columns to each row
        const enrichedData = timeSeriesData.map(row => {
            const dateStr = normalizeDate(row.event_date);
            const host = row.host;
            
            // Get revenue for this date (only for matching domain)
            const dailyRevenue = (host === domain) ? (revenueByDate[dateStr] || 0) : 0;
            
            // Get views for this date/host
            const dailyViews = viewsByDateAndHost[dateStr]?.[host] || 0;
            
            // Calculate RPM (revenue per 1000 views)
            const dailyRPM = dailyViews > 0 ? (dailyRevenue / dailyViews) * 1000 : 0;
            
            return {
                ...row,
                revenue: parseFloat(dailyRevenue.toFixed(2)),
                rpm: parseFloat(dailyRPM.toFixed(2)),
                smartscroll_in_views: parseInt(row.smartscroll_in_views || 0)
            };
        });
        
        return {
            enrichedData,
            revenueByDate,
            summary: {
                totalRevenue: revenueData.totalRevenue,
                totalEvents: revenueData.events.length,
                dateRange: {
                    start: startDate.toISOString().split('T')[0],
                    end: endDate.toISOString().split('T')[0]
                },
                lastCollectionAt: revenueData.lastCollectionAt
            }
        };
    } catch (error) {
        console.error(`❌ Error fetching revenue time series for ${domain}:`, error);
        throw error;
    }
}

async function inspectRevenueTimeSeries() {
    const domain = process.argv[2] || 'www.on3.com';
    const lookbackDays = parseInt(process.argv[3]) || 7;
    
    console.log('🔍 Inspecting Revenue and RPM Time Series Data\n');
    console.log(`Domain: ${domain}`);
    console.log(`Lookback Days: ${lookbackDays}`);
    console.log(`Database: ${process.env.DATABASE_URL ? '✅ Connected' : '❌ Missing DATABASE_URL'}\n`);
    
    // Validate required environment variables
    if (!process.env.DATABASE_URL) {
        console.error('❌ ERROR: DATABASE_URL is required');
        process.exit(1);
    }
    
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        console.error('❌ ERROR: AWS credentials are required for Athena queries');
        process.exit(1);
    }
    
    try {
        // Step 1: Check for existing local file first (skip query if found)
        const dataDir = path.join(__dirname, '..', 'data', 'athena-results', 'PerformanceReportTimeSeries');
        let localFilePath = null;
        let csvContent = null;
        
        try {
            // Find the most recent CSV file
            const dirs = await fs.readdir(dataDir);
            let mostRecentFile = null;
            let mostRecentTime = 0;
            
            for (const dir of dirs) {
                const dirPath = path.join(dataDir, dir);
                const stat = await fs.stat(dirPath);
                if (stat.isDirectory()) {
                    const files = await fs.readdir(dirPath);
                    const csvFiles = files.filter(f => f.endsWith('.csv'));
                    for (const file of csvFiles) {
                        const filePath = path.join(dirPath, file);
                        const fileStat = await fs.stat(filePath);
                        if (fileStat.mtimeMs > mostRecentTime) {
                            mostRecentTime = fileStat.mtimeMs;
                            mostRecentFile = filePath;
                        }
                    }
                }
            }
            
            if (mostRecentFile) {
                localFilePath = mostRecentFile;
                console.log(`📂 Using existing local file: ${localFilePath}\n`);
                csvContent = await fs.readFile(localFilePath, 'utf8');
                console.log(`✅ Successfully read ${(csvContent.length / 1024).toFixed(2)}KB from existing file\n`);
            }
        } catch (error) {
            // Directory doesn't exist or no files found, will run query
            console.log('📂 No existing local file found, will run new query...\n');
        }
        
        // Step 2: Run query only if no local file was found
        if (!csvContent) {
            console.log('📈 Fetching time series data from Athena...\n');
            const result = await executeQuery('PerformanceReportTimeSeries', {
                parameters: { days_back: lookbackDays },
                output_location: 's3://prod.makemula.ai/athena-results/'
            });
            
            console.log(`✅ Query completed: ${result.queryExecutionId}\n`);
            
            // Read the newly downloaded file
            const s3PathParts = result.outputLocation.split('/');
            const timestamp = s3PathParts[s3PathParts.length - 2];
            
            localFilePath = path.join(
                __dirname,
                '..',
                'data',
                'athena-results',
                'PerformanceReportTimeSeries',
                timestamp,
                `${result.queryExecutionId}.csv`
            );
            
            console.log(`📂 Reading newly downloaded file: ${localFilePath}\n`);
            
            try {
                csvContent = await fs.readFile(localFilePath, 'utf8');
                console.log(`✅ Successfully read ${(csvContent.length / 1024).toFixed(2)}KB from local file\n`);
            } catch (error) {
                throw new Error(`Could not read local file ${localFilePath}: ${error.message}\n` +
                              `The query runner should have downloaded it automatically.\n` +
                              `Check that the file exists at the path above.`);
            }
        }
        
        let timeSeriesData = parseCSV(csvContent);
        
        // Filter to the specific domain
        timeSeriesData = timeSeriesData.filter(row => row.host === domain);
        
        console.log(`✅ Loaded ${timeSeriesData.length} rows of time series data for ${domain}\n`);
        
        // Step 3: Fetch and enrich with revenue/RPM data
        const revenueData = await fetchRevenueTimeSeries(domain, lookbackDays, timeSeriesData);
        
        // Step 4: Filter to only show rows with revenue data (or all if you want to see zeros)
        const revenueRows = revenueData.enrichedData.filter(row => 
            row.host === domain && (row.revenue > 0 || row.rpm > 0)
        );
        
        // Step 5: Group by date for cleaner output
        const dailySummary = {};
        revenueData.enrichedData
            .filter(row => row.host === domain)
            .forEach(row => {
                const date = normalizeDate(row.event_date);
                if (!dailySummary[date]) {
                    dailySummary[date] = {
                        date: date,
                        revenue: 0,
                        rpm: 0,
                        smartscroll_in_views: 0,
                        widget_views: parseInt(row.widget_views || 0)
                    };
                }
                dailySummary[date].revenue += row.revenue;
                dailySummary[date].smartscroll_in_views += row.smartscroll_in_views;
                // Recalculate RPM for the day
                if (dailySummary[date].smartscroll_in_views > 0) {
                    dailySummary[date].rpm = (dailySummary[date].revenue / dailySummary[date].smartscroll_in_views) * 1000;
                }
            });
        
        // Output results
        console.log('\n' + '='.repeat(80));
        console.log('📊 REVENUE & RPM TIME SERIES SUMMARY');
        console.log('='.repeat(80));
        console.log(JSON.stringify({
            domain,
            lookbackDays,
            summary: revenueData.summary,
            dailyBreakdown: Object.values(dailySummary).sort((a, b) => 
                new Date(a.date) - new Date(b.date)
            ),
            revenueByDate: revenueData.revenueByDate
        }, null, 2));
        
        console.log('\n' + '='.repeat(80));
        console.log('📈 DETAILED TIME SERIES DATA (with revenue & RPM)');
        console.log('='.repeat(80));
        console.log(JSON.stringify(
            revenueData.enrichedData
                .filter(row => row.host === domain)
                .map(row => ({
                    date: normalizeDate(row.event_date),
                    host: row.host,
                    revenue: row.revenue,
                    rpm: row.rpm,
                    smartscroll_in_views: row.smartscroll_in_views,
                    widget_views: parseInt(row.widget_views || 0)
                }))
                .sort((a, b) => new Date(a.date) - new Date(b.date)),
            null,
            2
        ));
        
        console.log('\n✅ Inspection complete!\n');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nStack trace:');
        console.error(error.stack);
        process.exit(1);
    } finally {
        // Close database connection
        if (models.sequelize) {
            await models.sequelize.close();
        }
    }
}

// Helper function
function normalizeDate(dateValue) {
    if (dateValue instanceof Date) {
        return dateValue.toISOString().split('T')[0];
    }
    if (typeof dateValue === 'string') {
        // Handle dates with spaces (e.g., "2025-11-18 00:00:00.000")
        if (dateValue.includes(' ')) {
            return dateValue.split(' ')[0];
        }
        // Handle ISO format with T (e.g., "2025-11-18T00:00:00.000Z")
        if (dateValue.includes('T')) {
            return dateValue.split('T')[0];
        }
        // Handle formatted dates (e.g., "Nov 18, 2025")
        if (dateValue.includes(',')) {
            return new Date(dateValue).toISOString().split('T')[0];
        }
        // Assume it's already YYYY-MM-DD format
        return dateValue;
    }
    return dateValue;
}

// Run the inspection
if (require.main === module) {
    inspectRevenueTimeSeries()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { inspectRevenueTimeSeries };

