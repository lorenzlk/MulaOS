#!/usr/bin/env node

const { executeQuery, listQueries, getQueryMetadata } = require('./utils/query-runner');

/**
 * Test the query system
 */
async function testQuerySystem() {
    console.log('Testing Mula Athena Query System');
    console.log('================================');
    
    try {
        // Test 1: List available queries
        console.log('\n1. Listing available queries...');
        const queries = await listQueries();
        console.log(`Found ${queries.length} queries:`, queries);
        
        // Test 2: Get metadata for store-clicks query
        console.log('\n2. Getting metadata for store-clicks query...');
        const metadata = await getQueryMetadata('store-clicks');
        console.log('Metadata:', metadata);
        
        // Test 3: Test query execution (dry run - don't actually execute)
        console.log('\n3. Testing query loading (dry run)...');
        const { loadQuery } = require('./utils/query-runner');
        const query = await loadQuery('store-clicks', { days_back: 1 });
        console.log('Loaded query with parameters:');
        console.log(query);
        
        console.log('\n✅ All tests passed! The query system is working correctly.');
        console.log('\nTo run the actual query, use:');
        console.log('  npm run queries:run store-clicks');
        console.log('  npm run queries:run store-clicks -- --days-back 7');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    testQuerySystem();
}

module.exports = { testQuerySystem }; 