require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { sendSlackMessage } = require('../../helpers/SlackHelpers.js');

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
            return row ? parseInt(row[metric] || 0) : 0;
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
                    .reduce((sum, r) => sum + parseInt(r[metric] || 0), 0);
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
                    text: 'Top 5 Domains, 14 Days',
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
    const response = await axios.post('https://quickchart.io/chart/create', {
        chart: chartConfig,
        width: 800,
        height: 400,
        backgroundColor: 'white'
    });
    return response.data.url;
}

// Generate color palette
function getColor(index, alpha = 1) {
    const colors = [
        `rgba(54, 162, 235, ${alpha})`,   // Blue
        `rgba(255, 99, 132, ${alpha})`,   // Red
        `rgba(75, 192, 192, ${alpha})`,   // Teal
        `rgba(255, 205, 86, ${alpha})`,   // Yellow
        `rgba(153, 102, 255, ${alpha})`,  // Purple
        `rgba(255, 159, 64, ${alpha})`,   // Orange
        `rgba(199, 199, 199, ${alpha})`,  // Gray
        `rgba(83, 102, 255, ${alpha})`,   // Indigo
    ];
    return colors[index % colors.length];
}

// Generate Slack blocks with charts
function generateSlackBlocks(chartUrls) {
    const blocks = [
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: "*Mula Time Series Report - 14 Day Analysis*"
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

    // Add each chart as an image block
    for (const [metric, url] of Object.entries(chartUrls)) {
        const title = metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
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
            image_url: url,
            alt_text: `${title} time series chart`
        });
        
        blocks.push({
            type: 'divider'
        });
    }

    return blocks;
}

async function main() {
    try {
        console.log('Starting time series chart generation...');
        
        // Find the most recent CSV file in the PerformanceReportTimeSeries folder
        const baseDir = path.join('data', 'athena-results', 'PerformanceReportTimeSeries');
        const timestampDirs = await fs.readdir(baseDir);
        
        // Get directory stats to sort by actual creation/modification time
        const dirStats = await Promise.all(
            timestampDirs
                .filter(dir => /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/.test(dir))
                .map(async (dir) => {
                    const dirPath = path.join(baseDir, dir);
                    const stats = await fs.stat(dirPath);
                    return {
                        name: dir,
                        path: dirPath,
                        mtime: stats.mtime, // Use modification time
                        ctime: stats.ctime  // Creation time (on some systems)
                    };
                })
        );
        
        if (dirStats.length === 0) {
            throw new Error('No timestamp directories found in PerformanceReportTimeSeries folder');
        }
        
        // Sort by modification time (newest first)
        const sortedDirs = dirStats.sort((a, b) => b.mtime - a.mtime);
        const mostRecentDir = sortedDirs[0];
        
        console.log(`Most recent directory: ${mostRecentDir.name} (modified: ${mostRecentDir.mtime.toISOString()})`);
        
        const csvFiles = await fs.readdir(mostRecentDir.path);
        
        if (csvFiles.length === 0) {
            throw new Error(`No CSV files found in ${mostRecentDir.name}`);
        }
        
        // Get the first CSV file (there should only be one)
        const csvFileName = csvFiles.find(file => file.endsWith('.csv'));
        if (!csvFileName) {
            throw new Error(`No CSV file found in ${mostRecentDir.name}`);
        }
        
        const csvPath = path.join(mostRecentDir.path, csvFileName);
        console.log(`Using most recent CSV file: ${csvPath}`);
        const csvContent = await fs.readFile(csvPath, 'utf8');
        const data = parseCSV(csvContent);
        
        console.log(`Loaded ${data.length} rows of time series data`);
        
        // Define metrics to chart
        const metrics = {
            'tag_fires': 'Page Views Over Time',
            'widget_views': 'Widget Views Over Time',
            'store_clicks': 'Store Clicks Over Time', 
            'ad_views': 'Ad Views Over Time'
        };
        
        // Build color map for all top domains across all metrics
        const allTopDomains = getAllTopDomains(data, metrics, 5);
        const domainColorMap = buildDomainColorMap(allTopDomains, colorPalette);
        
        // Generate short chart URLs for each metric
        const chartUrls = {};
        for (const [metric, title] of Object.entries(metrics)) {
            console.log(`Generating chart for ${metric}...`);
            const chartConfig = generateChartConfig(data, metric, title, 5, domainColorMap);
            const chartUrl = await getShortChartUrl(chartConfig);
            chartUrls[metric] = chartUrl;
            console.log(`Chart URL: ${chartUrl}`);
        }
        
        // Generate Slack blocks
        const blocks = generateSlackBlocks(chartUrls);
        
        // Send to Slack
        console.log('Sending charts to Slack...');
        await sendSlackMessage(
            '#proj-mula-reports',
            "Here's your Mula time series report with visual charts! 📊",
            blocks
        );
        
        console.log('Successfully sent time series charts to Slack!');
        
    } catch (error) {
        console.error('Error generating time series charts:', error);
        process.exit(1);
    }
}

main(); 