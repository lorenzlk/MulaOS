require('dotenv').config();
const { executeQuery } = require('../queries/utils/query-runner');
const { uploadJsonToS3, getFile } = require('../helpers/S3Helpers');
const { sendSlackMessage } = require('../helpers/SlackHelpers.js');
const { getDomainChannelMappingsForReports } = require('../helpers/DomainChannelHelpers');
const { RevenueDataService } = require('../services/RevenueDataService');
const models = require('../models');
const fs = require('fs').promises;
const path = require('path');

// Parse CSV data
function parseCSV(csvContent) {
    const [headerLine, ...rows] = csvContent.trim().split('\n');
    const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
    return rows.map(row => {
        const values = row.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        return Object.fromEntries(values.map((val, i) => [headers[i], val]));
    });
}

// Get top N domains by total value for a metric
function getTopDomains(data, metric, topN = 5) {
    const totals = {};
    data.forEach(row => {
        const host = row.host;
        const value = parseInt(row[metric] || 0);
        totals[host] = (totals[host] || 0) + value;
    });
    return Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([host]) => host);
}

// Colorblind-friendly palette (Tableau 10)
const colorPalette = [
    '#1f77b4', // blue
    '#ff7f0e', // orange
    '#2ca02c', // green
    '#d62728', // red
    '#9467bd', // purple
    '#8c564b', // brown
    '#e377c2', // pink
    '#7f7f7f', // gray
    '#bcbd22', // yellow-green
    '#17becf'  // cyan
];

// Step 1: Collect all top domains across all metrics
function getAllTopDomains(data, metrics, topN = 5) {
    const domainSet = new Set();
    for (const metric of Object.keys(metrics)) {
        getTopDomains(data, metric, topN).forEach(domain => domainSet.add(domain));
    }
    return Array.from(domainSet);
}

// Step 2: Build color map
function buildDomainColorMap(domains, palette) {
    const map = {};
    domains.forEach((domain, i) => {
        map[domain] = palette[i % palette.length];
    });
    return map;
}

// Calculate aggregate values for each metric
function calculateAggregateValues(data, metrics) {
    const aggregates = {};
    
    for (const metric of Object.keys(metrics)) {
        const total = data.reduce((sum, row) => {
            const value = row[metric];
            // Handle decimal values for revenue and RPM
            return sum + (value ? parseFloat(value) : 0);
        }, 0);
        aggregates[metric] = total;
    }
    
    return aggregates;
}

// Fetch daily revenue and RPM time series data for a domain
async function fetchRevenueTimeSeries(domain, lookbackDays, timeSeriesData) {
    try {
        console.log(`Fetching daily revenue data for ${domain}...`);
        const revenueService = new RevenueDataService(models);
        
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - lookbackDays);
        
        // Get revenue events grouped by date
        const revenueData = await revenueService.getRevenueData(domain, startDate, endDate);
        
        // Group revenue by date
        const revenueByDate = {};
        revenueData.events.forEach(event => {
            // Handle both Date objects and date strings
            let dateStr;
            if (event.revenue_date instanceof Date) {
                dateStr = event.revenue_date.toISOString().split('T')[0];
            } else {
                dateStr = event.revenue_date.split('T')[0]; // Handle DATEONLY format
            }
            if (!revenueByDate[dateStr]) {
                revenueByDate[dateStr] = 0;
            }
            revenueByDate[dateStr] += parseFloat(event.revenue_amount);
        });
        
        // Merge revenue and RPM into time series data
        // First, create a map of date -> host -> smartscroll_in_views
        // Normalize date format for consistent matching
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
                revenue: dailyRevenue.toFixed(2),
                rpm: dailyRPM.toFixed(2)
            };
        });
        
        return enrichedData;
    } catch (error) {
        console.error(`Error fetching revenue time series for ${domain}:`, error);
        return timeSeriesData; // Return original data if revenue fetch fails
    }
}

// Fetch revenue data from cache and calculate RPM for on3.com (aggregate)
async function fetchOn3RPM(lookbackDays, smartscrollInViews) {
    try {
        console.log('Fetching cached revenue data for on3.com RPM calculation...');
        
        const revenueDataService = new RevenueDataService(models);
        
        // Calculate date range from lookback days
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (lookbackDays * 24 * 60 * 60 * 1000));
        
        // Get revenue data from cache (database)
        const rpmData = await revenueDataService.calculateRPM(
            'www.on3.com',
            startDate,
            endDate,
            smartscrollInViews,
            { platform: 'impact', subid1: 'mula' }
        );
        
        if (rpmData.eventCount === 0) {
            console.log('No revenue events found in cache for the specified date range');
            return null;
        }
        
        console.log(`RPM calculation: $${rpmData.totalRevenue} / ${smartscrollInViews} views * 1000 = $${rpmData.rpm} RPM`);
        console.log(`   Events: ${rpmData.eventCount}, Last collection: ${rpmData.lastCollectionAt || 'Never'}`);
        
        return {
            totalEarnings: rpmData.totalRevenue,
            smartscrollInViews,
            rpm: rpmData.rpm,
            lastCollectionAt: rpmData.lastCollectionAt,
            eventCount: rpmData.eventCount
        };
    } catch (error) {
        console.error('Error fetching cached revenue data for RPM calculation:', error);
        return null;
    }
}

// Generate chart config for QuickChart
function generateChartConfig(data, metric, title, topN = 5, domainColorMap = {}) {
    const topDomains = getTopDomains(data, metric, topN);
    const labels = [...new Set(data.map(row => row.event_date))]
        .sort((a, b) => new Date(a) - new Date(b))
        .map(date => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

    // Datasets for top domains
    const datasets = topDomains.map((host, i) => ({
        label: host,
        data: labels.map(labelDate => {
            // Find the row for this host and date
            const row = data.find(r => r.host === host && new Date(r.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === labelDate);
            if (!row) return 0;
            // Handle decimal values for revenue and RPM
            const value = row[metric];
            return value ? parseFloat(value) : 0;
        }),
        borderColor: domainColorMap[host] || colorPalette[i % colorPalette.length],
        backgroundColor: (domainColorMap[host] || colorPalette[i % colorPalette.length]) + '33',
        tension: 0.4,
        fill: false,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#fff',
        pointBorderWidth: 2,
        cubicInterpolationMode: 'monotone',
    }));

    // Optionally, group the rest as 'Other'
    const otherHosts = [...new Set(data.map(row => row.host))].filter(h => !topDomains.includes(h));
    if (otherHosts.length > 0) {
        datasets.push({
            label: 'Other',
            data: labels.map(labelDate => {
                // Sum for all other hosts on this date
                return data.filter(r => otherHosts.includes(r.host) && new Date(r.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === labelDate)
                    .reduce((sum, r) => {
                        const value = r[metric];
                        return sum + (value ? parseFloat(value) : 0);
                    }, 0);
            }),
            borderColor: '#cccccc',
            backgroundColor: '#cccccc33',
            tension: 0.4,
            fill: false,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#fff',
            pointBorderWidth: 1,
            cubicInterpolationMode: 'monotone',
        });
    }

    return {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            layout: { padding: 20 },
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: { size: 20, family: 'Inter, Lato, Roboto, Arial, sans-serif', weight: 'bold' }
                },
                subtitle: {
                    display: true,
                    text: `Top 5 Domains, ${data.length > 0 ? Math.ceil(data.length / [...new Set(data.map(row => row.host))].length) : 0} Days`,
                    font: { size: 14, family: 'Inter, Lato, Roboto, Arial, sans-serif' }
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: { size: 14, family: 'Inter, Lato, Roboto, Arial, sans-serif' },
                        boxWidth: 24
                    }
                },
                tooltip: {
                    backgroundColor: '#222',
                    titleFont: { size: 14, family: 'Inter, Lato, Roboto, Arial, sans-serif' },
                    bodyFont: { size: 13, family: 'Inter, Lato, Roboto, Arial, sans-serif' },
                    borderColor: '#fff',
                    borderWidth: 1
                }
            },
            elements: {
                line: {
                    borderWidth: 3,
                    borderCapStyle: 'round',
                    borderJoinStyle: 'round'
                },
                point: {
                    radius: 4,
                    hoverRadius: 7,
                    backgroundColor: '#fff',
                    borderWidth: 2
                }
            },
            scales: {
                x: {
                    grid: { color: '#eee' },
                    title: { display: true, text: 'Date', font: { size: 14 } },
                    ticks: { font: { size: 13 } }
                },
                y: {
                    grid: { color: '#eee' },
                    title: { display: true, text: metric.replace(/_/g, ' ').toUpperCase(), font: { size: 14 } },
                    ticks: { font: { size: 13 } }
                }
            }
        }
    };
}

// POST to QuickChart to get a short image URL
async function getShortChartUrl(chartConfig) {
    const response = await fetch('https://quickchart.io/chart/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chart: chartConfig,
            width: 800,
            height: 400,
            backgroundColor: 'white'
        })
    });
    
    if (!response.ok) {
        throw new Error(`QuickChart API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.url;
}

// Generate Slack blocks with charts
function generateSlackBlocks(chartUrls, lookbackDays, domains, networkWide = false, aggregateValues = {}, metrics = {}, rpmData = null) {
    let domainText;
    if (networkWide) {
        domainText = ' - Network-Wide Aggregation';
    } else if (domains && domains.length > 0) {
        domainText = ` for ${domains.join(', ')}`;
    } else {
        domainText = '';
    }
    
    const blocks = [
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*Mula Performance Report - ${lookbackDays} Day Analysis${domainText}*`
            }
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `Generated on: ${new Date().toLocaleString('en-US', {
                    timeZone: 'America/New_York',
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    timeZoneName: 'short'
                })}`
            }
        },
        {
            type: 'divider'
        }
    ];

    // Define the order we want to display metrics
    let metricOrder = ['tag_fires', 'bot_views', 'widget_views', 'smartscroll_in_views', 'topshelf_in_views', 'store_clicks', 'next_page_clicks'];
    
    // Add revenue and RPM charts if available (show them early, after widget views)
    if (metrics['revenue'] && metrics['rpm']) {
        metricOrder = ['tag_fires', 'bot_views', 'widget_views', 'smartscroll_in_views', 'topshelf_in_views', 'store_clicks', 'next_page_clicks', 'revenue', 'rpm'];
    }
    
    // Add each chart as an image block with aggregate values in the specified order
    for (const metric of metricOrder) {
        if (chartUrls[metric] && metrics[metric]) {
            const title = metrics[metric];
            const aggregateValue = aggregateValues[metric] || 0;
            
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*${title}*`
                }
            });
            
            blocks.push({
                type: 'image',
                title: {
                    type: 'plain_text',
                    text: title
                },
                image_url: chartUrls[metric],
                alt_text: `${title} time series chart`
            });
            
            // Calculate CTR for specific metrics based on smartscroll_in_views (viewable impressions)
            let ctrText = '';
            if (metric === 'store_clicks') {
                const smartscrollInViews = aggregateValues['smartscroll_in_views'] || 0;
                const ctr = smartscrollInViews > 0 ? ((aggregateValue / smartscrollInViews) * 100).toFixed(1) : '0.0';
                ctrText = `, CTR: ${ctr}%`;
            } else if (metric === 'next_page_clicks') {
                const smartscrollInViews = aggregateValues['smartscroll_in_views'] || 0;
                const ctr = smartscrollInViews > 0 ? ((aggregateValue / smartscrollInViews) * 100).toFixed(1) : '0.0';
                ctrText = `, CTR: ${ctr}%`;
            } else if (metric === 'topshelf_in_views') {
                const smartscrollInViews = aggregateValues['smartscroll_in_views'] || 0;
                const ctr = smartscrollInViews > 0 ? ((aggregateValue / smartscrollInViews) * 100).toFixed(1) : '0.0';
                ctrText = `, CTR: ${ctr}%`;
            }
            
            // Format aggregate value based on metric type
            let formattedValue;
            if (metric === 'revenue') {
                formattedValue = `$${aggregateValue.toFixed(2)}`;
            } else if (metric === 'rpm') {
                formattedValue = `$${aggregateValue.toFixed(2)}`;
            } else {
                formattedValue = aggregateValue.toLocaleString();
            }
            
            // Add aggregate value text block
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `📊 *Total ${title}: ${formattedValue}${ctrText}*`
                }
            });
            
            blocks.push({
                type: 'divider'
            });
        }
    }

    // Add RPM data for on3.com if available (at the bottom)
    if (rpmData) {
        const lastCollectionText = rpmData.lastCollectionAt
            ? `\n• Last Updated: ${new Date(rpmData.lastCollectionAt).toLocaleString('en-US', {
                timeZone: 'America/New_York',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}`
            : '\n• Last Updated: Never';
        
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*💰 On3.com Revenue Performance*\n• Total Earnings: $${rpmData.totalEarnings.toFixed(2)}\n• SmartScroll In-Views: ${rpmData.smartscrollInViews.toLocaleString()}\n• RPM: $${rpmData.rpm}${lastCollectionText}`
            }
        });
    }

    return blocks;
}

// Get the top-level domain from any domain string
function getTLD(domain) {
    if (!domain) return '';
    
    // Convert to lowercase and remove any protocol
    let cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '');
    
    // Reverse, split, take first 2, reverse, join
    const reversed = cleanDomain.split('').reverse().join('');
    const parts = reversed.split('.');
    const tldParts = parts.slice(0, 2).reverse();
    
    return tldParts.join('.');
}

// Filter data by domains if specified
function filterDataByDomains(data, domains) {
    if (!domains || domains.length === 0) {
        return data;
    }
    
    // Normalize domains to TLDs for matching
    const normalizedDomains = domains.map(domain => getTLD(domain));
    
    return data.filter(row => {
        const normalizedHost = getTLD(row.host);
        return normalizedDomains.includes(normalizedHost);
    });
}

// Aggregate data across all domains by date for network-wide reports
function aggregateDataByDate(data) {
    const aggregated = {};
    
    data.forEach(row => {
        const date = row.event_date;
        if (!aggregated[date]) {
                    aggregated[date] = {
            event_date: date,
            host: 'NETWORK',
            tag_fires: 0,
            widget_views: 0,
            smartscroll_in_views: 0,
            topshelf_in_views: 0,
            store_clicks: 0,
            next_page_clicks: 0,
            ad_views: 0,
            bot_views: 0
        };
        }
        
        // Sum all metrics across all domains for this date
        aggregated[date].tag_fires += parseInt(row.tag_fires || 0);
        aggregated[date].widget_views += parseInt(row.widget_views || 0);
        aggregated[date].smartscroll_in_views += parseInt(row.smartscroll_in_views || 0);
        aggregated[date].topshelf_in_views += parseInt(row.topshelf_in_views || 0);
        aggregated[date].store_clicks += parseInt(row.store_clicks || 0);
        aggregated[date].next_page_clicks += parseInt(row.next_page_clicks || 0);
        aggregated[date].ad_views += parseInt(row.ad_views || 0);
        aggregated[date].bot_views += parseInt(row.bot_views || 0);
    });
    
    // Convert back to array and sort by date
    return Object.values(aggregated).sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
}

async function processPerformanceReport(job) {
    const { domains, lookbackDays = 7, networkWide = false, channelId, channelName } = job.data;
    
    try {
        const reportType = networkWide ? 'NETWORK-WIDE' : (domains ? domains.join(', ') : 'ALL');
        console.log(`Processing performance report for domains: ${reportType}, lookback: ${lookbackDays} days`);
        
        // Execute the query
        const result = await executeQuery('PerformanceReportTimeSeries', {
            parameters: { days_back: lookbackDays },
            output_location: 's3://prod.makemula.ai/athena-results/'
        });
        
        console.log(`Query completed: ${result.queryExecutionId}`);
        
        // Extract the S3 key from the output location and fetch CSV content
        const s3Key = result.outputLocation.replace('s3://prod.makemula.ai/', '');
        const fileResponse = await getFile(s3Key, 'prod.makemula.ai');
        
        if (!fileResponse.ok) {
            throw new Error(`Could not fetch Athena results from ${result.outputLocation}`);
        }
        
        // getFile returns content as a string - use .text() for CSV
        const csvContent = await fileResponse.text();
        let data = parseCSV(csvContent);
        
        // Filter by domains if specified (and not network-wide)
        if (domains && domains.length > 0 && !networkWide) {
            data = filterDataByDomains(data, domains);
        }
        
        // For network-wide aggregation, aggregate data across all domains by date
        if (networkWide) {
            data = aggregateDataByDate(data);
        }
        
        console.log(`Loaded ${data.length} rows of time series data`);
        
        // Check if this is on3.com and fetch revenue time series data
        const isOn3 = domains && domains.length === 1 && domains[0] === 'www.on3.com';
        if (isOn3) {
            console.log('Enriching time series data with revenue and RPM for on3.com...');
            data = await fetchRevenueTimeSeries('www.on3.com', lookbackDays, data);
        }
        
        // Define metrics to chart
        const metrics = {
            'tag_fires': 'Page Views Over Time',
            'bot_views': 'Bot Views Over Time',
            'widget_views': 'Widget Loads Over Time',
            'smartscroll_in_views': 'SmartScroll In-Views Over Time',
            'topshelf_in_views': 'TopShelf In-Views Over Time',
            'store_clicks': 'Store Clicks Over Time',
            'next_page_clicks': 'Next Page Clicks Over Time'
        };
        
        // Add revenue and RPM metrics if we have revenue data
        if (isOn3) {
            metrics['revenue'] = 'Daily Revenue Over Time';
            metrics['rpm'] = 'RPM Over Time';
        }
        
        // Build color map for all top domains across all metrics
        const allTopDomains = getAllTopDomains(data, metrics, 5);
        const domainColorMap = buildDomainColorMap(allTopDomains, colorPalette);
        
        // Generate short chart URLs for each metric
        const chartUrls = {};
        for (const [metric, title] of Object.entries(metrics)) {
            console.log(`Generating chart for ${metric}...`);
            const chartConfig = generateChartConfig(data, metric, title, networkWide ? 1 : 5, domainColorMap);
            const chartUrl = await getShortChartUrl(chartConfig);
            chartUrls[metric] = chartUrl;
            console.log(`Chart URL: ${chartUrl}`);
        }
        
        // Calculate aggregate values for each metric
        const aggregateValues = calculateAggregateValues(data, metrics);
        console.log('Aggregate values calculated:', aggregateValues);
        
        // Check if this is on3.com and fetch aggregate RPM data (for summary display)
        let rpmData = null;
        if (isOn3) {
            const smartscrollInViews = aggregateValues['smartscroll_in_views'] || 0;
            rpmData = await fetchOn3RPM(lookbackDays, smartscrollInViews);
        }
        
        // Filter out in-view metrics if they represent less than 5% of widget views
        const filteredMetrics = { ...metrics };
        const widgetViewsTotal = aggregateValues['widget_views'] || 0;
        
        if (widgetViewsTotal > 0) {
            const smartscrollPercentage = (aggregateValues['smartscroll_in_views'] || 0) / widgetViewsTotal;
            const topshelfPercentage = (aggregateValues['topshelf_in_views'] || 0) / widgetViewsTotal;
            
            if (smartscrollPercentage < 0.05) {
                delete filteredMetrics['smartscroll_in_views'];
                console.log(`Excluding smartscroll_in_views (${(smartscrollPercentage * 100).toFixed(1)}% of widget views)`);
            }
            
            if (topshelfPercentage < 0.05) {
                delete filteredMetrics['topshelf_in_views'];
                console.log(`Excluding topshelf_in_views (${(topshelfPercentage * 100).toFixed(1)}% of widget views)`);
            }
        }
        
        // Generate Slack blocks
        const blocks = generateSlackBlocks(chartUrls, lookbackDays, domains, networkWide, aggregateValues, filteredMetrics, rpmData);
        
        // Send to Slack
        console.log(`Sending charts to Slack channel: ${channelName}`);
        const messageText = networkWide 
            ? `Here's your Mula network-wide performance report with visual charts! 📊 (${lookbackDays} days)`
            : `Here's your Mula performance report with visual charts! 📊 (${lookbackDays} days${domains && domains.length > 0 ? `, ${domains.join(', ')}` : ''})`;
        
        await sendSlackMessage(channelName, messageText, blocks);
        
        console.log('Successfully sent performance report to Slack!');
        
    } catch (error) {
        console.error('Error processing performance report:', error);
        
        // Send error message to Slack
        try {
            const errorText = networkWide 
                ? `Failed to generate network-wide performance report for ${lookbackDays} days. Please try again later.`
                : `Failed to generate performance report for ${lookbackDays} days${domains && domains.length > 0 ? ` for ${domains.join(', ')}` : ''}. Please try again later.`;
            
            await sendSlackMessage(
                channelName,
                `❌ Error generating performance report: ${error.message}`,
                [{
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: errorText
                    }
                }]
            );
        } catch (slackError) {
            console.error('Error sending error message to Slack:', slackError);
        }
        
        throw error;
    }
}

module.exports = { processPerformanceReport }; 