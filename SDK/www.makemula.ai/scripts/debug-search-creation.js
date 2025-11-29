const { Search } = require('../models');
const crypto = require('crypto');

async function debugSearchCreation() {
  try {
    console.log('Debugging search creation with exact cURL data...');
    
    // Exact data from the cURL request
    const testPhrase = 'Coldplan fan merch';
    
    console.log('Test phrase:', testPhrase);
    
    // Generate phraseID using the same logic as the fixed endpoint
    const phraseIdInput = [
      testPhrase.toLowerCase(),
      'amazon', // default platform
      JSON.stringify(null) // default platformConfig
    ].join('|');
    const phraseID = crypto.createHash('sha256').update(phraseIdInput).digest('hex');
    
    console.log('Generated phraseID:', phraseID);
    console.log('phraseIdInput:', phraseIdInput);
    
    // Test the exact findOrCreate logic from the fixed endpoint
    console.log('\nTesting findOrCreate...');
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
    
    console.log('Search result:', {
      created: created,
      id: search.id,
      phrase: search.phrase,
      phraseID: search.phraseID,
      platform: search.platform,
      platformConfig: search.platformConfig,
      status: search.status
    });
    
    // Test if we can create another one (should find existing)
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
    
    console.log('Duplicate result:', {
      created: created2,
      id: search2.id,
      phrase: search2.phrase,
      phraseID: search2.phraseID,
      platform: search2.platform,
      platformConfig: search2.platformConfig,
      status: search2.status
    });
    
    // Clean up
    await search.destroy();
    console.log('\nTest search cleaned up');
    
  } catch (error) {
    console.error('Error debugging search creation:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`Validation error for ${err.path}: ${err.message}`);
      });
    }
    if (error.parent) {
      console.error('Database error:', error.parent.message);
    }
  }
}

// Run the debug
debugSearchCreation().then(() => {
  console.log('Debug completed');
  process.exit(0);
}).catch(error => {
  console.error('Debug failed:', error);
  process.exit(1);
}); 