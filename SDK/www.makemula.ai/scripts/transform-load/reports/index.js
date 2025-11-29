require('dotenv').config();
const Bull = require('bull');
const { getDomainChannelMappingsForReports } = require('../../../helpers/DomainChannelHelpers.js');

// Redis connection
const redisUrl = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';
const performanceReportQueue = new Bull('performanceReportQueue', redisUrl);

// Domain whitelist for reports
const WHITELISTED_DOMAINS = [
    'www.on3.com',
    'network' // Special case for network-wide reports
];

// Channel mappings for whitelisted domains
const DOMAIN_CHANNELS = {
    'www.on3.com': '#proj-mula-on3', // You can change this to the appropriate channel
    'network': '#proj-mula-reports'
};

/**
 * Process performance report for a specific domain or network
 * @param {string} domain - Domain name or 'network' for network-wide report
 * @param {string} channelId - Slack channel ID to send report to
 * @param {string} channelName - Slack channel name for display
 */
async function processPerformanceReport(domain, channelId, channelName) {
    try {
        console.log(`Processing performance report for ${domain}...`);
        
        const isNetwork = domain === 'network';
        const domains = isNetwork ? null : [domain];
        const lookbackDays = 7; // 7-day lookback as requested
        
        // Queue the performance report job
        await performanceReportQueue.add('generateReport', {
            domains,
            lookbackDays,
            networkWide: isNetwork,
            channelId,
            channelName
        });
        
        console.log(`✅ Queued performance report for ${domain} (${lookbackDays} days)`);
        
    } catch (error) {
        console.error(`❌ Error processing performance report for ${domain}:`, error);
        throw error;
    }
}

/**
 * Load domain-channel mappings from database and merge with whitelist
 */
async function loadChannelMappings() {
    try {
        const { sites, displayNames } = await getDomainChannelMappingsForReports();
        
        // Merge database mappings with our whitelist channels
        const channelMappings = { ...DOMAIN_CHANNELS };
        
        // Add any whitelisted domains that have database mappings
        for (const domain of WHITELISTED_DOMAINS) {
            if (sites[domain]) {
                channelMappings[domain] = sites[domain];
            }
        }
        
        console.log('Loaded channel mappings:', channelMappings);
        return channelMappings;
        
    } catch (error) {
        console.error('Error loading channel mappings from database:', error);
        // Fallback to our default mappings
        return DOMAIN_CHANNELS;
    }
}

/**
 * Main function to process all whitelisted domains
 */
async function run() {
    try {
        console.log('🚀 Starting reports-publish for whitelisted domains...');
        console.log('Whitelisted domains:', WHITELISTED_DOMAINS);
        
        // Load channel mappings
        const channelMappings = await loadChannelMappings();
        
        // Process each whitelisted domain
        for (const domain of WHITELISTED_DOMAINS) {
            const channelId = channelMappings[domain];
            const channelName = channelId ? channelId.replace('#', '') : 'unknown';
            
            if (!channelId) {
                console.warn(`⚠️  No channel mapping found for domain: ${domain}`);
                continue;
            }
            
            await processPerformanceReport(domain, channelId, channelName);
        }
        
        console.log('✅ All performance reports queued successfully');
        
    } catch (error) {
        console.error('❌ Error in reports-publish:', error);
        process.exit(1);
    }
}

// Run the script
run();