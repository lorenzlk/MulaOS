#!/usr/bin/env node

/**
 * Initialize Revenue Collection Status
 * 
 * Sets up collection status for a domain/platform so it can start collecting revenue data.
 * 
 * Usage:
 *   node scripts/initialize-revenue-collection.js <domain> <platform> [cadenceHours]
 * 
 * Example:
 *   node scripts/initialize-revenue-collection.js www.on3.com impact 24
 */

require('dotenv').config();
const { initializeCollectionStatus } = require('../workers/scheduledRevenueCollection');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node scripts/initialize-revenue-collection.js <domain> <platform> [cadenceHours]');
    console.error('Example: node scripts/initialize-revenue-collection.js www.on3.com impact 24');
    process.exit(1);
  }

  const domain = args[0];
  const platform = args[1];
  const cadenceHours = args[2] ? parseInt(args[2], 10) : 24;

  if (!['impact', 'amazon_associates', 'other'].includes(platform)) {
    console.error(`Invalid platform: ${platform}. Must be one of: impact, amazon_associates, other`);
    process.exit(1);
  }

  console.log(`🚀 Initializing revenue collection for ${domain} (${platform})`);
  console.log(`   Cadence: Every ${cadenceHours} hours`);

  try {
    const status = await initializeCollectionStatus(domain, platform, cadenceHours);
    
    console.log(`\n✅ Collection status initialized:`);
    console.log(`   Domain: ${status.domain}`);
    console.log(`   Platform: ${status.platform}`);
    console.log(`   Cadence: ${status.collection_cadence_hours} hours`);
    console.log(`   Active: ${status.is_active}`);
    console.log(`   Last Collection: ${status.last_successful_collection_at || 'Never'}`);
    
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Run the scheduler: node workers/scheduledRevenueCollection.js`);
    console.log(`   2. Or manually trigger a collection job via the queue`);
    
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Error initializing collection status:`, error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

