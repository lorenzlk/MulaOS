const { Search } = require('../models');
const crypto = require('crypto');

async function testSearchCreation() {
  try {
    console.log('Testing search creation...');
    
    // Test data
    const testPhrase = 'Coldplan fan merch';
    
    // Generate phraseID using the same logic as the fixed endpoint
    const phraseIdInput = [
      testPhrase.toLowerCase(),
      'amazon', // default platform
      JSON.stringify(null) // default platformConfig
    ].join('|');
    const phraseID = crypto.createHash('sha256').update(phraseIdInput).digest('hex');
    
    console.log('Generated phraseID:', phraseID);
    
    // Test findOrCreate (same logic as the fixed endpoint)
    const [search, created] = await Search.findOrCreate({
      where: {
        phrase: testPhrase,
        platform: 'amazon',
        platformConfig: null
      },
      defaults: {
        phraseID: phraseID,
        status: 'pending',
        platformConfig: null
      }
    });
    
    console.log('Search findOrCreate result:', {
      created: created,
      id: search.id,
      phrase: search.phrase,
      phraseID: search.phraseID,
      platform: search.platform,
      status: search.status
    });
    
    // Test duplicate creation
    console.log('\nTesting duplicate creation...');
    const [search2, created2] = await Search.findOrCreate({
      where: {
        phrase: testPhrase,
        platform: 'amazon',
        platformConfig: null
      },
      defaults: {
        phraseID: phraseID,
        status: 'pending',
        platformConfig: null
      }
    });
    
    console.log('Duplicate search findOrCreate result:', {
      created: created2,
      id: search2.id,
      phrase: search2.phrase,
      phraseID: search2.phraseID,
      platform: search2.platform,
      status: search2.status
    });
    
    // Clean up - delete the test search
    await search.destroy();
    console.log('Test search cleaned up');
    
  } catch (error) {
    console.error('Error testing search creation:', error);
    console.error('Error details:', error.message);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`Validation error for ${err.path}: ${err.message}`);
      });
    }
  }
}

// Run the test
testSearchCreation().then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
}); 