require('dotenv').config();
const { getDomainChannelMappingsForReports } = require('../helpers/DomainChannelHelpers');

async function testMappings() {
    try {
        console.log('Testing domain-channel mappings...');
        
        const { sites, displayNames } = await getDomainChannelMappingsForReports();
        
        console.log('\nSites mappings:');
        Object.entries(sites).forEach(([domain, channel]) => {
            console.log(`  ${domain} → ${channel}`);
        });
        
        console.log('\nDisplay names:');
        Object.entries(displayNames).forEach(([domain, displayName]) => {
            console.log(`  ${domain} → ${displayName}`);
        });
        
        console.log('\n✅ Test completed successfully!');
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run test if this script is executed directly
if (require.main === module) {
    testMappings();
}

module.exports = { testMappings }; 