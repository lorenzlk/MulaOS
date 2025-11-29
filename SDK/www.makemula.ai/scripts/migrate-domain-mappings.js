require('dotenv').config();
const { DomainChannelMapping } = require('../models');

const EXISTING_MAPPINGS = [
    { domain: 'brit.co', channelName: '#proj-mula-brit', displayName: null },
    { domain: 'spotcovery.com', channelName: '#proj-mula-spotcovery', displayName: null },
    { domain: 'gritdaily.com', channelName: '#proj-mula-gritdaily', displayName: null },
    { domain: 'defpen.com', channelName: '#proj-mula-defpen', displayName: null },
    { domain: 'reviews.allwomenstalk.com', channelName: '#proj-mula-allwomenstalk', displayName: null },
    { domain: 'mula-usage-example.vercel.app', channelName: '#proj-mula-deepai', displayName: 'DeepAI.org' },
    { domain: 'www.dev.on3.com', channelName: '#proj-mula-on3', displayName: null }
];

async function migrateMappings() {
    try {
        console.log('Starting migration of domain-channel mappings...');
        
        // Check if mappings already exist
        const existingCount = await DomainChannelMapping.count();
        if (existingCount > 0) {
            console.log(`Found ${existingCount} existing mappings. Skipping migration.`);
            return;
        }
        
        // Create mappings
        for (const mapping of EXISTING_MAPPINGS) {
            await DomainChannelMapping.create({
                domain: mapping.domain,
                channelId: 'placeholder', // This will be updated when commands are used
                channelName: mapping.channelName,
                displayName: mapping.displayName
            });
            console.log(`✅ Created mapping: ${mapping.domain} → ${mapping.channelName}`);
        }
        
        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Error during migration:', error);
        process.exit(1);
    }
}

// Run migration if this script is executed directly
if (require.main === module) {
    migrateMappings();
}

module.exports = { migrateMappings }; 