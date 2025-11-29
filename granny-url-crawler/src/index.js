const SitemapCrawler = require('./scrapers/SitemapCrawler');
const PatternAnalyzer = require('./analyzers/PatternAnalyzer');
const TargetingRuleGenerator = require('./analyzers/TargetingRuleGenerator');
const fs = require('fs').promises;
const path = require('path');

async function discoverUrlPatterns(domain, options = {}) {
  console.log(`\n🔍 Discovering URL patterns for ${domain}...\n`);
  
  const maxUrls = options.maxUrls || 10000;
  const maxSitemaps = options.maxSitemaps || 30; // Increased from 15
  
  try {
    // Step 1: Crawl sitemap
    console.log('📊 Step 1: Crawling sitemap...\n');
    const crawler = new SitemapCrawler();
    const urls = await crawler.crawl(domain, { maxUrls, maxSitemaps });
    
    // Step 2: Analyze patterns
    console.log('\n📊 Step 2: Analyzing URL patterns...\n');
    const analyzer = new PatternAnalyzer();
    const patterns = analyzer.analyze(urls);
    
    // Step 3: Generate targeting rules
    console.log('\n📊 Step 3: Generating targeting rules...\n');
    const generator = new TargetingRuleGenerator();
    const rules = generator.generate(patterns);
    
    // Output results
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📍 URL PATTERNS DISCOVERED');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log(`Domain: ${domain}`);
    console.log(`URLs Analyzed: ${urls.length}`);
    console.log(`Patterns Found: ${rules.length}\n`);
    
    for (const rule of rules) {
      console.log(`${rule.sport.toUpperCase()}`);
      console.log(`  Pattern: ${rule.path}`);
      console.log(`  Confidence: ${rule.confidence}%`);
      console.log(`  Status: ${rule.status}`);
      console.log(`  URLs: ${rule.url_count}`);
      console.log(`  Search: "${rule.search_phrase}"`);
      
      if (rule.variations && rule.variations.length > 0) {
        console.log(`  Variations detected:`);
        for (const variation of rule.variations) {
          console.log(`    - ${variation.example_pattern} (${variation.count} URLs)`);
        }
      }
      
      console.log(`  Sample URLs:`);
      for (const url of rule.sample_urls.slice(0, 2)) {
        console.log(`    - ${url}`);
      }
      console.log('');
    }
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎯 READY-TO-USE TARGETING RULES');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const highConfidenceRules = rules.filter(r => r.confidence >= 70);
    
    if (highConfidenceRules.length === 0) {
      console.log('⚠️  No high-confidence patterns found.');
      console.log('   Manual review required for this publisher.\n');
    } else {
      console.log(`Found ${highConfidenceRules.length} high-confidence patterns:\n`);
      
      for (const rule of highConfidenceRules) {
        console.log(`✅ ${rule.sport.toUpperCase()}`);
        console.log(`   Path: ${rule.path}`);
        console.log(`   Search: "${rule.search_phrase}"`);
        console.log(`   Confidence: ${rule.confidence}%\n`);
      }
      
      console.log('Slack Commands (copy & paste):');
      console.log('─────────────────────────────────────────────────────\n');
      
      for (const rule of highConfidenceRules) {
        const slackCmd = generator.generateSlackCommand(rule);
        console.log(slackCmd);
      }
      console.log('');
    }
    
    // Save results
    const outputDir = path.join(__dirname, '../output');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, `${domain}-url-patterns.json`);
    await fs.writeFile(outputPath, JSON.stringify({
      domain: domain,
      analyzed_at: new Date().toISOString(),
      urls_analyzed: urls.length,
      patterns_found: rules.length,
      patterns: patterns,
      targeting_rules: rules
    }, null, 2));
    
    console.log(`💾 Results saved to: ${outputPath}\n`);
    
    return {
      domain: domain,
      urls_analyzed: urls.length,
      patterns: patterns,
      targeting_rules: rules
    };
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    throw error;
  }
}

// CLI usage
if (require.main === module) {
  const domain = process.argv[2];
  const maxUrls = process.argv[3] ? parseInt(process.argv[3]) : 10000;
  
  if (!domain) {
    console.error('Usage: node src/index.js <domain> [maxUrls]');
    console.error('Example: node src/index.js essentiallysports.com 5000');
    process.exit(1);
  }
  
  discoverUrlPatterns(domain, { maxUrls })
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n❌ Failed:', error.message);
      process.exit(1);
    });
}

module.exports = { discoverUrlPatterns };

