#!/usr/bin/env node

/**
 * CLI tool to test next-page recommendations query
 * Usage: node scripts/test-next-page-query.js <domain> <lookback_days> <category_or_path> [limit]
 * Example: node scripts/test-next-page-query.js www.on3.com 7 "/teams/michigan-wolverines" 5
 */

require('dotenv').config();
const { executeQuery } = require('../queries/utils/query-runner');

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('❌ Usage: node scripts/test-next-page-query.js <domain> <lookback_days> <category_or_path> [limit]');
    console.log('📝 Example: node scripts/test-next-page-query.js www.on3.com 7 "/teams/michigan-wolverines" 5');
    process.exit(1);
  }

  const [domain, lookbackDays, categoryOrPath, limit = 5] = args;

  console.log('🔍 Testing Next-Page Recommendations Query');
  console.log('==========================================');
  console.log(`Domain: ${domain}`);
  console.log(`Lookback: ${lookbackDays} days`);
  console.log(`Category/Path: ${categoryOrPath}`);
  console.log(`Limit: ${limit}`);
  console.log('');

  try {
    console.log('⏳ Executing query...');
    
    const result = await executeQuery('next-page-recommendations', {
      parameters: {
        domain,
        days_back: parseInt(lookbackDays),
        category_or_path: categoryOrPath,
        limit: parseInt(limit)
      }
    });

    if (result.success) {
      console.log('✅ Query executed successfully!');
      console.log(`📊 Query ID: ${result.queryExecutionId}`);
      console.log(`📁 Output location: ${result.outputLocation}`);
      
      // Try to read and display results
      if (result.localFilePath) {
        console.log('\n📋 Results:');
        console.log('===========');
        
        const fs = require('fs').promises;
        try {
          const csvContent = await fs.readFile(result.localFilePath, 'utf8');
          const lines = csvContent.trim().split('\n');
          
          if (lines.length <= 1) {
            console.log('No results found.');
          } else {
            console.log('URL,View Count');
            lines.forEach(line => console.log(line));
          }
        } catch (readError) {
          console.log('⚠️  Could not read results file:', readError.message);
          console.log('📁 Results will be available at:', result.outputLocation);
        }
      }
    } else {
      console.log('❌ Query failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error executing query:', error.message);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);
