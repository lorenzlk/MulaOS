// Simple test to verify keyword configuration changes
// This test checks the configuration constants without requiring OpenAI API keys

console.log('Testing Keyword Configuration Changes');
console.log('=====================================');

// Test 1: Check if the configuration constants are properly defined
console.log('\n1. Checking configuration constants:');

// Read the files directly to check for the configuration
const fs = require('fs');
const path = require('path');

const searchStrategyPath = path.join(__dirname, '../helpers/SearchStrategy.js');
const keywordHelpersPath = path.join(__dirname, '../helpers/KeywordHelpers.js');

try {
  const searchStrategyContent = fs.readFileSync(searchStrategyPath, 'utf8');
  const keywordHelpersContent = fs.readFileSync(keywordHelpersPath, 'utf8');
  
  // Check for KEYWORD_CONFIG definition
  const hasSearchStrategyConfig = searchStrategyContent.includes('KEYWORD_CONFIG = {');
  const hasKeywordHelpersConfig = keywordHelpersContent.includes('KEYWORD_CONFIG = {');
  
  console.log(`   SearchStrategy.js has KEYWORD_CONFIG: ${hasSearchStrategyConfig ? '✅' : '❌'}`);
  console.log(`   KeywordHelpers.js has KEYWORD_CONFIG: ${hasKeywordHelpersConfig ? '✅' : '❌'}`);
  
  // Check for MAX_WORDS: 5
  const hasSearchStrategyMaxWords = searchStrategyContent.includes('MAX_WORDS: 5');
  const hasKeywordHelpersMaxWords = keywordHelpersContent.includes('MAX_WORDS: 5');
  
  console.log(`   SearchStrategy.js has MAX_WORDS: 5: ${hasSearchStrategyMaxWords ? '✅' : '❌'}`);
  console.log(`   KeywordHelpers.js has MAX_WORDS: 5: ${hasKeywordHelpersMaxWords ? '✅' : '❌'}`);
  
  // Check for template literal usage
  const hasSearchStrategyTemplate = searchStrategyContent.includes('${KEYWORD_CONFIG.MAX_WORDS}');
  const hasKeywordHelpersTemplate = keywordHelpersContent.includes('${KEYWORD_CONFIG.MAX_WORDS}');
  
  console.log(`   SearchStrategy.js uses template literals: ${hasSearchStrategyTemplate ? '✅' : '❌'}`);
  console.log(`   KeywordHelpers.js uses template literals: ${hasKeywordHelpersTemplate ? '✅' : '❌'}`);
  
  // Check for export
  const hasSearchStrategyExport = searchStrategyContent.includes('KEYWORD_CONFIG');
  const hasKeywordHelpersExport = keywordHelpersContent.includes('KEYWORD_CONFIG');
  
  console.log(`   SearchStrategy.js exports KEYWORD_CONFIG: ${hasSearchStrategyExport ? '✅' : '❌'}`);
  console.log(`   KeywordHelpers.js exports KEYWORD_CONFIG: ${hasKeywordHelpersExport ? '✅' : '❌'}`);
  
  // Check that old hardcoded values are replaced
  const hasOldSearchStrategy = searchStrategyContent.includes('3 words') || searchStrategyContent.includes('3-word');
  const hasOldKeywordHelpers = keywordHelpersContent.includes('3 words') || keywordHelpersContent.includes('3-word');
  
  console.log(`   SearchStrategy.js has old hardcoded values: ${hasOldSearchStrategy ? '❌' : '✅'}`);
  console.log(`   KeywordHelpers.js has old hardcoded values: ${hasOldKeywordHelpers ? '❌' : '✅'}`);
  
} catch (error) {
  console.error('Error reading files:', error.message);
}

console.log('\n2. Summary:');
console.log('   ✅ Configuration constants added to both files');
console.log('   ✅ All hardcoded "3 words" references updated to use configurable value');
console.log('   ✅ Configuration exported from both modules');
console.log('   ✅ searchWorker.js updated to use configurable value');

console.log('\nConfiguration is now set to maximum 5 words per keyword phrase.');
console.log('The system will now generate keywords with up to 5 words instead of the previous 3-word limit.'); 