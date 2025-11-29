const RssScraper = require('./scrapers/RssScraper');
const SitemapScraper = require('./scrapers/SitemapScraper');
const NavigationScraper = require('./scrapers/NavigationScraper');
const TrafficEstimator = require('./analyzers/TrafficEstimator');
const fs = require('fs').promises;
const path = require('path');

async function analyzePublisher(domain) {
  console.log(`\n🔍 Analyzing ${domain}...\n`);
  
  const scrapers = {
    rss: new RssScraper(),
    sitemap: new SitemapScraper(),
    navigation: new NavigationScraper()
  };
  
  const results = {};
  
  // Run scrapers in parallel
  console.log('📊 Gathering data from public sources...\n');
  
  const [rss, sitemap, navigation] = await Promise.all([
    scrapers.rss.scrape(domain).catch(() => null),
    scrapers.sitemap.scrape(domain).catch(() => null),
    scrapers.navigation.scrape(domain).catch(() => null)
  ]);
  
  if (rss) {
    results.rss = rss;
  } else {
    console.log('  ⚠️  RSS feed not found\n');
  }
  
  if (sitemap) {
    results.sitemap = sitemap;
  } else {
    console.log('  ⚠️  Sitemap not found\n');
  }
  
  if (navigation) {
    results.navigation = navigation;
  } else {
    console.log('  ⚠️  Navigation analysis failed\n');
  }
  
  // Estimate traffic distribution
  console.log('🧮 Calculating traffic estimates...\n');
  
  const estimator = new TrafficEstimator();
  const estimate = estimator.estimate(results);
  
  // Output results
  console.log('═══════════════════════════════════════════════════════');
  console.log('📈 ESTIMATED TRAFFIC DISTRIBUTION');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`Confidence: ${estimate.confidence}%`);
  console.log(`Sources: ${estimate.sources_used.join(', ')}\n`);
  
  for (const [category, data] of Object.entries(estimate.estimated_distribution)) {
    const bar = '█'.repeat(Math.round(data.percentage / 2));
    console.log(`${data.rank}. ${category.toUpperCase().padEnd(15)} ${data.percentage}% ${bar}`);
  }
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('💡 RECOMMENDATION');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`Priority 1 (Start Here):  ${estimate.recommendation.priority_1.toUpperCase()}`);
  console.log(`Priority 2 (Add Next):    ${estimate.recommendation.priority_2.toUpperCase()}`);
  console.log(`Priority 3 (Then):        ${estimate.recommendation.priority_3.toUpperCase()}`);
  console.log(`\n${estimate.recommendation.recommendation || estimate.recommendation.note}\n`);
  
  // Save to file
  const outputDir = path.join(__dirname, '../output');
  await fs.mkdir(outputDir, { recursive: true });
  
  const outputPath = path.join(outputDir, `${domain}-traffic-estimate.json`);
  await fs.writeFile(outputPath, JSON.stringify({
    domain: domain,
    analyzed_at: new Date().toISOString(),
    ...estimate,
    raw_data: results
  }, null, 2));
  
  console.log(`💾 Results saved to: ${outputPath}\n`);
  
  return estimate;
}

// CLI usage
if (require.main === module) {
  const domain = process.argv[2];
  
  if (!domain) {
    console.error('Usage: node src/index.js <domain>');
    console.error('Example: node src/index.js essentiallysports.com');
    process.exit(1);
  }
  
  analyzePublisher(domain)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    });
}

module.exports = { analyzePublisher };

