#!/usr/bin/env node

/**
 * Test script for the Slack A/B test performance command
 * This script simulates the Slack command request to test the functionality
 */

const { runSmartScrollABTestSlackReport } = require('./smartscroll-ab-test-slack-report.js');

async function testSlackABTestCommand() {
    console.log('🧪 Testing Slack A/B Test Performance Command...\n');
    
    try {
        // Test with default parameters
        console.log('📋 Test 1: Default parameters');
        await runSmartScrollABTestSlackReport({
            days_back: 7,
            experiment_name: 'smartscroll_button_variant',
            use_cached: true, // Use cached for testing
            channel: '#test-channel'
        });
        console.log('✅ Test 1 completed successfully\n');
        
        // Test with custom parameters
        console.log('📋 Test 2: Custom parameters');
        await runSmartScrollABTestSlackReport({
            days_back: 14,
            experiment_name: 'test_experiment',
            use_cached: true,
            channel: '#test-channel'
        });
        console.log('✅ Test 2 completed successfully\n');
        
        console.log('🎉 All tests passed! The Slack command should work correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run the test if this script is executed directly
if (require.main === module) {
    testSlackABTestCommand()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testSlackABTestCommand }; 