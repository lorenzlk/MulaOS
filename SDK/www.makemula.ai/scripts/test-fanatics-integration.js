require('dotenv').config();
const { searchFanaticsProducts, transformFanaticsProduct } = require('../helpers/ProductHelpers');
const FanaticsSearchStrategy = require('../helpers/strategies/FanaticsSearchStrategy');

async function testFanaticsIntegration() {
  console.log('🧪 Testing Fanatics Integration...\n');

  try {
    // Test 1: Direct API call
    console.log('1. Testing direct API call...');
    const results = await searchFanaticsProducts('Ohio State Buckeyes Football');
    console.log(`✅ Found ${results.products.length} products`);
    
    if (results.products.length > 0) {
      console.log('Sample product:', results.products[0]);
    }

    // Test 2: Product transformation
    console.log('\n2. Testing product transformation...');
    if (results.products.length > 0) {
      const transformed = transformFanaticsProduct(results.products[0], 1);
      console.log('✅ Transformed product:', transformed);
    }

    // Test 3: Search strategy
    console.log('\n3. Testing search strategy...');
    const strategy = new FanaticsSearchStrategy();
    
    // Test keyword generation
    const keywordResult = await strategy.generateKeywords(
      'Ohio State Buckeyes football team wins championship',
      'on3.com'
    );
    console.log('✅ Generated keywords:', keywordResult.keywords);
    console.log('✅ Platform config:', keywordResult.platformConfig);

    // Test search execution
    const searchResults = await strategy.executeSearch(
      keywordResult.keywords,
      keywordResult.platformConfig
    );
    console.log(`✅ Search executed, found ${searchResults.productCount} products`);

    // Test quality assessment
    const qualityScore = await strategy.assessQuality(
      searchResults.products,
      keywordResult.keywords
    );
    console.log(`✅ Quality score: ${qualityScore}`);

    console.log('\n🎉 All tests passed! Fanatics integration is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Check environment variables
    console.log('\n🔍 Environment check:');
    console.log('IMPACT_ACCOUNT_ID:', process.env.IMPACT_ACCOUNT_ID ? '✅ Set' : '❌ Missing');
    console.log('IMPACT_USERNAME:', process.env.IMPACT_USERNAME ? '✅ Set' : '❌ Missing');
    console.log('IMPACT_PASSWORD:', process.env.IMPACT_PASSWORD ? '✅ Set' : '❌ Missing');
  }
}

// Run the test
testFanaticsIntegration().catch(console.error); 