const SitemapScraper = require('./scrapers/SitemapScraper');
const RssScraper = require('./scrapers/RssScraper');
const PatternAnalyzer = require('./analyzers/PatternAnalyzer');
const SdkHealthCheck = require('./healthcheck/SdkHealthCheck');
const PlacementDetector = require('./placement/PlacementDetector');
const CompetitorDetector = require('./placement/CompetitorDetector');
const fs = require('fs').promises;
const path = require('path');

/**
 * DukeOnboarding - Onboarding & Placement Intelligence Agent
 * 
 * Answers: "Where should we place SmartScroll and what pages is it eligible for?"
 * 
 * Capabilities:
 * - SDK Health Check
 * - Traffic Analysis
 * - URL Pattern Discovery
 * - SmartScroll Placement Intelligence
 * - Competitor Detection (Taboola/Outbrain)
 * - Deployment Readiness Assessment
 */
class DukeOnboarding {
  async analyze(domain, options = {}) {
    const maxUrls = options.maxUrls || 15000;
    const testUrl = options.testUrl || null;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏄‍♂️ DUKE ONBOARDING & PLACEMENT INTELLIGENCE`);
    console.log(`${'='.repeat(60)}\n`);
    console.log(`Domain: ${domain}`);
    if (testUrl) {
      console.log(`Test URL: ${testUrl}`);
    }
    console.log(`Started: ${new Date().toISOString()}\n`);
    
    const results = {
      domain: domain,
      analyzed_at: new Date().toISOString(),
      health_check: null,
      traffic_estimate: null,
      url_patterns: null,
      placement_intelligence: null,
      competitor_intelligence: null,
      deployment_ready: false,
      recommendations: []
    };
    
    // Phase 1: SDK Health Check
    console.log(`${'─'.repeat(60)}`);
    console.log(`PHASE 1: SDK HEALTH CHECK`);
    console.log(`${'─'.repeat(60)}\n`);
    
    const healthChecker = new SdkHealthCheck();
    // If specific URL provided, use it for SDK check
    results.health_check = await healthChecker.check(domain, { testUrl: testUrl });
    
    const healthStatus = healthChecker.generateStatus(results.health_check);
    console.log(`\n  Status: ${healthStatus}\n`);
    
    if (results.health_check.errors.length > 0) {
      console.log(`  Errors:`);
      results.health_check.errors.forEach(err => console.log(`    - ${err}`));
      console.log('');
    }
    
    if (results.health_check.warnings.length > 0) {
      console.log(`  Warnings:`);
      results.health_check.warnings.forEach(warn => console.log(`    - ${warn}`));
      console.log('');
    }
    
    // Phase 2: Traffic Analysis (skip for specific URLs)
    console.log(`${'─'.repeat(60)}`);
    console.log(`PHASE 2: TRAFFIC DISTRIBUTION ANALYSIS`);
    console.log(`${'─'.repeat(60)}\n`);
    
    let urls = [];
    let sitemapData = null;
    let rssData = null;
    
    // If testing a specific URL, skip site-wide traffic analysis
    if (testUrl && testUrl.includes('/') && testUrl !== `https://${domain}` && testUrl !== `http://${domain}`) {
      console.log(`  ℹ️  Specific URL provided - skipping site-wide traffic analysis`);
      console.log(`  📍 Focusing analysis on: ${testUrl}\n`);
      results.traffic_estimate = {
        status: 'skipped',
        message: 'Traffic analysis skipped for specific URL - use domain-level analysis (e.g., on3.com) for site-wide insights',
        total_urls: 0,
        distribution: {},
        sources: [],
        confidence: 0
      };
    } else {
      // Full domain analysis
      const sitemapScraper = new SitemapScraper();
      const rssScraper = new RssScraper();
      let sources = [];
    
      // Try sitemap
      try {
        sitemapData = await sitemapScraper.scrape(domain);
      if (sitemapData && sitemapData.total_urls > 0) {
        // Use all URLs from sitemap (not just samples) for better pattern analysis
        if (sitemapData.all_urls && sitemapData.all_urls.length > 0) {
          urls = urls.concat(sitemapData.all_urls.slice(0, 5000)); // Limit to 5000 for performance
        } else {
          // Fallback: extract from distribution if all_urls not available
          for (const [category, data] of Object.entries(sitemapData.distribution || {})) {
            if (data.sample_urls) {
              urls = urls.concat(data.sample_urls);
            }
          }
        }
        sources.push('sitemap');
        console.log(`  ✅ Sitemap analyzed (${sitemapData.total_urls} URLs, using ${Math.min(urls.length, 5000)} for analysis)\n`);
      }
    } catch (error) {
      console.log(`  ⚠️  Sitemap not accessible: ${error.message}\n`);
    }
    
      // Try RSS
      try {
        rssData = await rssScraper.scrape(domain);
      if (rssData && rssData.distribution) {
        sources.push('rss');
        // Extract URLs from RSS distribution for pattern analysis
        const rssUrls = Object.values(rssData.distribution).flatMap(d => d.sample_urls || []);
        urls = urls.concat(rssUrls);
        console.log(`  ✅ RSS feed analyzed (${rssData.total_items || 0} items)\n`);
      }
    } catch (error) {
      console.log(`  ⚠️  RSS feed not found\n`);
    }
    
    // Also try to get all URLs from sitemap (not just samples)
    if (sitemapData && sitemapData.all_urls && sitemapData.all_urls.length > 0) {
      // Add more URLs from sitemap if available
      const additionalUrls = sitemapData.all_urls.slice(0, 1000); // Limit to 1000 for performance
      urls = urls.concat(additionalUrls);
    }
    
      if (urls.length === 0 && !rssData) {
        console.log(`  ❌ Unable to gather traffic data (no sitemap or RSS)\n`);
        results.traffic_estimate = {
          status: 'failed',
          message: 'No data sources available',
          total_urls: 0,
          distribution: {},
          sources: [],
          confidence: 0
        };
      } else {
        results.traffic_estimate = this.analyzeTraffic(urls, rssData);
        this.printTrafficSummary(results.traffic_estimate);
      }
    }
    
    // Phase 3: URL Targeting Pattern Discovery
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`PHASE 3: URL TARGETING PATTERN DISCOVERY`);
    console.log(`${'─'.repeat(60)}`);
    console.log(`  ℹ️  Targeting patterns identify which pages SmartScroll should appear on`);
    console.log(`  📋 Patterns are used in Slack commands: /mula target <pattern> <search-phrase>\n`);
    
    let discoveredPatterns = [];
    let patternUrls = [];
    
    // Get URLs for pattern analysis (skip if specific URL provided)
    if (testUrl && testUrl.includes('/') && testUrl !== `https://${domain}` && testUrl !== `http://${domain}`) {
      console.log(`  ℹ️  Using specific URL for pattern/placement analysis: ${testUrl}`);
      patternUrls = [testUrl];
      discoveredPatterns = [testUrl];
    } else {
      // URLs already collected from Phase 2 traffic analysis
      patternUrls = urls; // Use URLs from Phase 2
    }
    
    if (patternUrls.length > 0) {
      console.log(`  📊 Analyzing ${patternUrls.length} URLs for patterns...`);
      const patternAnalyzer = new PatternAnalyzer();
      const patterns = patternAnalyzer.analyze(patternUrls);
      
      console.log(`  📋 Pattern analyzer returned: ${typeof patterns}, keys: ${Object.keys(patterns || {}).length}`);
      
      if (patterns && Object.keys(patterns).length > 0) {
        results.url_patterns = this.formatPatterns(patterns);
        this.printPatternSummary(results.url_patterns);
        
        // Extract sample URLs for placement analysis
        discoveredPatterns = results.url_patterns.flatMap(p => p.sample_urls || []);
        console.log(`  ✅ Extracted ${discoveredPatterns.length} sample URLs for placement analysis`);
      } else {
        console.log(`  ⚠️  Pattern analyzer returned no patterns - generating patterns from URL structure...`);
        // Generate basic patterns from URLs even if sport detection failed
        const basicPatterns = this.generateBasicPatterns(urls);
        if (basicPatterns.length > 0) {
          results.url_patterns = basicPatterns;
          console.log(`  ✅ Generated ${basicPatterns.length} basic patterns from URL structure`);
          discoveredPatterns = basicPatterns.flatMap(p => p.sample_urls || []);
        } else {
        // Still try to use URLs directly for placement
        discoveredPatterns = patternUrls.slice(0, 10); // Use first 10 URLs
          results.url_patterns = [];
          console.log(`  📝 Using ${discoveredPatterns.length} URLs directly for placement analysis`);
        }
      }
    } else {
      console.log(`  ❌ No URLs available for pattern analysis\n`);
      results.url_patterns = [];
      discoveredPatterns = [];
    }
    
    // Phase 4: SmartScroll Placement Intelligence (NEW!)
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`PHASE 4: SMARTSCROLL PLACEMENT INTELLIGENCE`);
    console.log(`${'─'.repeat(60)}\n`);
    
    if (discoveredPatterns.length > 0) {
      if (testUrl && testUrl.includes('/')) {
        console.log(`  📍 Analyzing specific page for placement: ${testUrl}`);
      } else {
        console.log(`  📍 Analyzing ${discoveredPatterns.length} URLs for placement...`);
      }
      const placementDetector = new PlacementDetector();
      results.placement_intelligence = await placementDetector.analyze(domain, discoveredPatterns);
      this.printPlacementIntelligence(results.placement_intelligence);
      
      // Extract patterns from placement intelligence if URL patterns are empty
      if ((!results.url_patterns || results.url_patterns.length === 0) && 
          results.placement_intelligence.eligible_pages &&
          results.placement_intelligence.eligible_pages.length > 0) {
        console.log(`  🔄 Extracting URL patterns from placement intelligence...`);
        const placementPatterns = results.placement_intelligence.eligible_pages.map(page => ({
          sport: 'general',
          pattern: page.pattern,
          confidence: page.eligibility_score,
          url_count: 1,
          sample_urls: page.sample_urls || [page.url],
          search_phrase: this.generateSearchPhrase('general'),
          source: 'placement_analysis'
        }));
        
        // Deduplicate patterns
        const uniquePatterns = [];
        const seenPatterns = new Set();
        for (const p of placementPatterns) {
          if (!seenPatterns.has(p.pattern)) {
            seenPatterns.add(p.pattern);
            uniquePatterns.push(p);
          }
        }
        
        if (uniquePatterns.length > 0) {
          results.url_patterns = uniquePatterns;
          console.log(`  ✅ Extracted ${uniquePatterns.length} patterns from placement analysis`);
        }
      }
    } else {
      console.log(`  ⚠️  No sample URLs available for placement analysis\n`);
      results.placement_intelligence = {
        status: 'failed',
        message: 'No sample URLs available - need URLs from sitemap/RSS or manual input'
      };
    }
    
    // Phase 5: Competitor Intelligence (NEW!)
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`PHASE 5: COMPETITOR INTELLIGENCE`);
    console.log(`${'─'.repeat(60)}\n`);
    
    if (discoveredPatterns.length > 0) {
      if (testUrl && testUrl.includes('/')) {
        console.log(`  🔍 Analyzing specific page for competitors: ${testUrl}`);
      } else {
        console.log(`  🔍 Analyzing ${discoveredPatterns.length} URLs for competitors...`);
      }
      const competitorDetector = new CompetitorDetector();
      results.competitor_intelligence = await competitorDetector.analyze(domain, discoveredPatterns);
      this.printCompetitorIntelligence(results.competitor_intelligence);
    } else {
      console.log(`  ⚠️  No sample URLs available for competitor analysis\n`);
      results.competitor_intelligence = {
        status: 'failed',
        message: 'No sample URLs available - need URLs from sitemap/RSS or manual input'
      };
    }
    
    // Phase 6: Generate Recommendations
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`PHASE 6: DEPLOYMENT RECOMMENDATIONS`);
    console.log(`${'─'.repeat(60)}\n`);
    
    this.generateRecommendations(results);
    
    // Phase 7: Calculate Deployment Readiness
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`PHASE 7: DEPLOYMENT READINESS`);
    console.log(`${'─'.repeat(60)}\n`);
    
    results.deployment_readiness = this.calculateDeploymentReadiness(results);
    this.printDeploymentReadiness(results.deployment_readiness);
    
    this.printRecommendations(results);
    
    // Save results
    await this.saveResults(results);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ ANALYSIS COMPLETE`);
    console.log(`${'='.repeat(60)}\n`);
    
    return results;
  }
  
  analyzeTraffic(urls, rssData) {
    const sportKeywords = require(path.join(__dirname, '../data/sport-keywords.json'));
    const distribution = {};
    
    // Analyze URLs by sport
    for (const url of urls) {
      const lowerUrl = url.toLowerCase();
      let matched = false;
      
      for (const [sport, keywords] of Object.entries(sportKeywords)) {
        for (const keyword of keywords) {
          if (lowerUrl.includes(keyword)) {
            if (!distribution[sport]) {
              distribution[sport] = 0;
            }
            distribution[sport]++;
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
      
      if (!matched) {
        if (!distribution['other']) {
          distribution['other'] = 0;
        }
        distribution['other']++;
      }
    }
    
    // Calculate percentages
    const total = urls.length;
    const percentages = {};
    
    for (const [sport, count] of Object.entries(distribution)) {
      if (sport !== 'other') {
        percentages[sport] = {
          count: count,
          percentage: Math.round((count / total) * 100),
          rank: 0
        };
      }
    }
    
    // Sort by percentage
    const sorted = Object.entries(percentages)
      .sort((a, b) => b[1].percentage - a[1].percentage);
    
    sorted.forEach(([sport, data], index) => {
      data.rank = index + 1;
    });
    
    return {
      total_urls: total,
      distribution: Object.fromEntries(sorted),
      sources: ['sitemap', 'rss'].filter(s => s),
      confidence: urls.length > 5000 ? 80 : urls.length > 1000 ? 70 : 60
    };
  }
  
  formatPatterns(patterns) {
    const formatted = [];
    
    for (const [sport, pattern] of Object.entries(patterns)) {
      formatted.push({
        sport: sport,
        pattern: pattern.pattern,
        confidence: pattern.confidence,
        url_count: pattern.url_count,
        sample_urls: pattern.sample_urls.slice(0, 5), // More URLs for placement analysis
        search_phrase: this.generateSearchPhrase(sport)
      });
    }
    
    // Sort by confidence
    formatted.sort((a, b) => b.confidence - a.confidence);
    
    return formatted;
  }
  
  generateBasicPatterns(urls) {
    // Generate basic patterns from URL structure when sport detection fails
    const patterns = [];
    const patternMap = {};
    
    for (const url of urls) {
      try {
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        
        // Extract pattern by replacing dynamic segments
        // e.g., /teams/michigan-wolverines/news/article-title -> /teams/*/news/*
        let pattern = path
          .replace(/\/[^\/]+-[^\/]+-[^\/]+/g, '/*')  // Long slugs
          .replace(/\/\d{4}\/\d{2}\/\d{2}\//g, '/*/*/*/')  // Dates
          .replace(/\/[a-f0-9]{8,}/g, '/*')  // Hashes/IDs
          .replace(/\/[^\/]+$/g, '/*');  // Last segment
        
        // Clean up multiple wildcards
        pattern = pattern.replace(/\*\/\*/g, '*').replace(/\*+/g, '*');
        
        if (!patternMap[pattern]) {
          patternMap[pattern] = {
            pattern: pattern,
            url_count: 0,
            sample_urls: [],
            confidence: 0
          };
        }
        
        patternMap[pattern].url_count++;
        if (patternMap[pattern].sample_urls.length < 3) {
          patternMap[pattern].sample_urls.push(url);
        }
      } catch (error) {
        continue;
      }
    }
    
    // Convert to array and calculate confidence
    for (const [pattern, data] of Object.entries(patternMap)) {
      if (data.url_count >= 2) {  // At least 2 URLs match
        const confidence = Math.min(100, Math.round((data.url_count / urls.length) * 100));
        patterns.push({
          sport: 'general',  // Generic pattern
          pattern: pattern,
          confidence: confidence,
          url_count: data.url_count,
          sample_urls: data.sample_urls,
          search_phrase: this.generateSearchPhrase('general')
        });
      }
    }
    
    // Sort by confidence
    patterns.sort((a, b) => b.confidence - a.confidence);
    
    return patterns;
  }
  
  generateBasicPatterns(urls) {
    // Generate basic patterns from URL structure when sport detection fails
    const patterns = [];
    const patternMap = {};
    
    for (const url of urls) {
      try {
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        
        // Extract pattern by replacing dynamic segments
        // e.g., /teams/michigan-wolverines/news/article-title -> /teams/*/news/*
        let pattern = path
          .replace(/\/[^\/]+-[^\/]+-[^\/]+/g, '/*')  // Long slugs
          .replace(/\/\d{4}\/\d{2}\/\d{2}\//g, '/*/*/*/')  // Dates
          .replace(/\/[a-f0-9]{8,}/g, '/*')  // Hashes/IDs
          .replace(/\/[^\/]+$/g, '/*');  // Last segment
        
        // Clean up multiple wildcards
        pattern = pattern.replace(/\*\/\*/g, '*').replace(/\*+/g, '*');
        
        if (!patternMap[pattern]) {
          patternMap[pattern] = {
            pattern: pattern,
            url_count: 0,
            sample_urls: [],
            confidence: 0
          };
        }
        
        patternMap[pattern].url_count++;
        if (patternMap[pattern].sample_urls.length < 3) {
          patternMap[pattern].sample_urls.push(url);
        }
      } catch (error) {
        continue;
      }
    }
    
    // Convert to array and calculate confidence
    for (const [pattern, data] of Object.entries(patternMap)) {
      if (data.url_count >= 2) {  // At least 2 URLs match
        const confidence = Math.min(100, Math.round((data.url_count / urls.length) * 100));
        patterns.push({
          sport: 'general',  // Generic pattern
          pattern: pattern,
          confidence: confidence,
          url_count: data.url_count,
          sample_urls: data.sample_urls,
          search_phrase: this.generateSearchPhrase('general')
        });
      }
    }
    
    // Sort by confidence
    patterns.sort((a, b) => b.confidence - a.confidence);
    
    return patterns;
  }
  
  generateSearchPhrase(sport) {
    const phrases = {
      'nfl': 'NFL merchandise',
      'nba': 'NBA team merchandise',
      'cfb': 'College Football merchandise',
      'mlb': 'MLB baseball merchandise',
      'nhl': 'NHL hockey merchandise',
      'tennis': 'Tennis equipment and apparel',
      'golf': 'Golf equipment and apparel',
      'boxing': 'Boxing equipment and gear',
      'ufc': 'UFC and MMA merchandise',
      'nascar': 'NASCAR racing merchandise',
      'soccer': 'Soccer equipment and apparel',
      'wrestling': 'WWE wrestling merchandise',
      'general': 'Sports merchandise'
    };
    
    return phrases[sport] || `${sport.toUpperCase()} merchandise`;
  }
  
  generateRecommendations(results) {
    const recs = [];
    
    // SDK Status
    if (!results.health_check.sdk_present) {
      recs.push({
        priority: '🔴 CRITICAL',
        category: 'SDK Deployment',
        message: 'Mula SDK is not deployed. Cannot proceed with targeting configuration.',
        action: 'Deploy SDK via GTM or direct script tag'
      });
      results.deployment_ready = false;
    } else if (results.health_check.errors.length > 0) {
      recs.push({
        priority: '🟡 HIGH',
        category: 'SDK Health',
        message: 'SDK deployed but has errors',
        action: 'Review SDK deployment and fix errors'
      });
      results.deployment_ready = false;
    } else {
      recs.push({
        priority: '✅ GOOD',
        category: 'SDK Health',
        message: 'SDK deployed and healthy',
        action: 'Ready for targeting configuration'
      });
      results.deployment_ready = true;
    }
    
    // Placement Intelligence
    if (results.placement_intelligence && results.placement_intelligence.eligible_pages) {
      const eligible = results.placement_intelligence.eligible_pages;
      const highScore = eligible.filter(p => p.eligibility_score >= 80);
      
      if (highScore.length > 0) {
        recs.push({
          priority: '✅ READY',
          category: 'Placement',
          message: `${highScore.length} page(s) with high eligibility score (80%+)`,
          action: 'Deploy SmartScroll using recommended DOM selectors'
        });
      }
    }
    
    // Competitor Detection
    if (results.competitor_intelligence && results.competitor_intelligence.competitors) {
      const competitors = results.competitor_intelligence.competitors;
      if (competitors.length > 0) {
        const competitorNames = competitors.map(c => c.name).join(', ');
        recs.push({
          priority: 'ℹ️ INFO',
          category: 'Competitors',
          message: `Competitor(s) detected: ${competitorNames}`,
          action: 'Review competitor placement and consider A/B testing opportunities'
        });
      }
    }
    
    // Traffic Analysis
    if (results.traffic_estimate && results.traffic_estimate.distribution) {
      const topSports = Object.entries(results.traffic_estimate.distribution)
        .slice(0, 3);
      
      if (topSports.length > 0) {
        recs.push({
          priority: '✅ READY',
          category: 'Traffic Intelligence',
          message: `Top sports identified: ${topSports.map(([s, d]) => `${s.toUpperCase()} (${d.percentage}%)`).join(', ')}`,
          action: 'Deploy targeting for top 3 sports first'
        });
      }
    }
    
    // URL Targeting Patterns
    if (results.url_patterns && Array.isArray(results.url_patterns) && results.url_patterns.length > 0) {
      const highConfidence = results.url_patterns.filter(p => p.confidence >= 70);
      
      if (highConfidence.length > 0) {
        recs.push({
          priority: '✅ READY',
          category: 'Targeting Patterns',
          message: `${highConfidence.length} high-confidence targeting pattern(s) discovered`,
          action: 'Use patterns to target which pages SmartScroll appears on (e.g., /mula target <pattern> <search-phrase>)'
        });
      } else {
        recs.push({
          priority: '⚠️ MEDIUM',
          category: 'Targeting Patterns',
          message: 'Targeting patterns found but confidence is low',
          action: 'Manual review recommended before deployment'
        });
      }
    }
    
    results.recommendations = recs;
  }
  
  calculateDeploymentReadiness(results, options = {}) {
    const isSpecificUrl = options.isSpecificUrl || false;
    const checks = {};
    let total = 0;
    const blockers = [];
    const quickWins = [];
    
    // SDK Deployment (20 points)
    if (results.health_check.sdk_present) {
      checks.sdk_deployment = 20;
      quickWins.push('✅ SDK already deployed');
    } else {
      checks.sdk_deployment = 0;
      blockers.push('🔴 SDK not deployed (1-2 days to deploy)');
    }
    total += checks.sdk_deployment;
    
    // URL Targeting Patterns (25 points) - adjust for specific URL analysis
    const patternCount = Array.isArray(results.url_patterns) ? results.url_patterns.length : 
                        Object.keys(results.url_patterns || {}).length;
    if (isSpecificUrl) {
      // For specific URLs, patterns are less relevant - give partial credit
      checks.url_patterns = 15;
      quickWins.push('ℹ️ Analyzing specific page - targeting patterns extracted from page structure');
    } else if (patternCount >= 5) {
      checks.url_patterns = 25;
      quickWins.push(`✅ ${patternCount} targeting patterns discovered`);
    } else if (patternCount >= 3) {
      checks.url_patterns = 20;
      quickWins.push(`✅ ${patternCount} targeting patterns discovered (good start)`);
    } else if (patternCount >= 1) {
      checks.url_patterns = 10;
      blockers.push(`🟡 Only ${patternCount} targeting pattern(s) - need manual pattern input`);
    } else {
      checks.url_patterns = 0;
      blockers.push('🔴 No targeting patterns detected - manual pattern input required');
    }
    total += checks.url_patterns;
    
    // Placement Intelligence (20 points)
    if (results.placement_intelligence && results.placement_intelligence.eligible_pages) {
      const eligible = results.placement_intelligence.eligible_pages;
      const highScore = eligible.filter(p => p.eligibility_score >= 80);
      if (highScore.length > 0) {
        checks.placement = 20;
        quickWins.push(`✅ ${highScore.length} eligible page(s) with high placement score`);
      } else if (eligible.length > 0) {
        checks.placement = 10;
        blockers.push('🟡 Placement detected but needs review');
      } else {
        checks.placement = 0;
        blockers.push('🔴 No eligible pages for SmartScroll placement');
      }
    } else {
      checks.placement = 0;
    }
    total += checks.placement;
    
    // Traffic Data Quality (15 points) - skip for specific URL analysis
    if (isSpecificUrl) {
      checks.traffic_data = 0; // Not applicable for specific URL
    } else if (results.traffic_estimate && results.traffic_estimate.confidence >= 70) {
      checks.traffic_data = 15;
    } else if (results.traffic_estimate && results.traffic_estimate.confidence >= 50) {
      checks.traffic_data = 10;
    } else {
      checks.traffic_data = 5;
    }
    total += checks.traffic_data;
    
    // Tech Stack (10 points) - assumes GTM makes deployment easier
    checks.tech_stack = 10;
    total += checks.tech_stack;
    
    // Content Structure (5 points)
    checks.content_structure = 5;
    total += checks.content_structure;
    
    // Competitive Landscape (5 points)
    if (results.competitor_intelligence && results.competitor_intelligence.competitors) {
      const competitors = results.competitor_intelligence.competitors;
      if (competitors.length > 0) {
        checks.competitive_landscape = 5; // Opportunity for beta test
        const competitorNames = competitors.map(c => c.name).join(', ');
        quickWins.push(`🎯 ${competitors.length} competitor(s) detected: ${competitorNames}`);
      } else {
        checks.competitive_landscape = 5; // No competition = easier deployment
      }
    } else {
      checks.competitive_landscape = 5;
    }
    total += checks.competitive_landscape;
    
    const percentage = Math.round((total / 100) * 100);
    
    let timeline = '';
    let level = '';
    if (percentage >= 80) {
      timeline = '3-5 days';
      level = 'Ready Now';
    } else if (percentage >= 60) {
      timeline = '1-2 weeks';
      level = 'Ready Soon';
    } else {
      timeline = '2-4 weeks';
      level = 'Needs Work';
    }
    
    // Generate critical path
    const criticalPath = this.generateCriticalPath(results, blockers);
    
    return {
      score: total,
      percentage: percentage,
      level: level,
      timeline: timeline,
      checks: checks,
      blockers: blockers,
      quick_wins: quickWins,
      critical_path: criticalPath
    };
  }
  
  generateCriticalPath(results, blockers) {
    const path = [];
    
    if (!results.health_check.sdk_present) {
      path.push('1. Deploy Mula SDK via GTM or direct script tag (1-2 days)');
    }
    
    const patternCount = Array.isArray(results.url_patterns) ? results.url_patterns.length : 
                        Object.keys(results.url_patterns || {}).length;
    if (patternCount < 3) {
      path.push('2. Add manual targeting patterns or refine pattern detection (2-4 hours)');
    }
    
    if (results.placement_intelligence && results.placement_intelligence.eligible_pages) {
      const eligible = results.placement_intelligence.eligible_pages;
      const highScore = eligible.filter(p => p.eligibility_score >= 80);
      if (highScore.length === 0) {
        path.push('3. Review DOM structure and placement options (1 day)');
      }
    }
    
    if (results.health_check.sdk_present && patternCount >= 3) {
      path.push('1. Configure 3-5 targeting rules in Slack (2 hours)');
      path.push('2. QA on staging environment (1 day)');
      path.push('3. Deploy to production (same day)');
    }
    
    if (path.length === 0) {
      path.push('1. Configure targeting rules (2 hours)');
      path.push('2. QA and deploy (1 day)');
    }
    
    return path;
  }
  
  printPlacementIntelligence(placement) {
    if (!placement || !placement.eligible_pages) {
      console.log(`  ❌ No placement intelligence available\n`);
      return;
    }
    
    console.log(`  Eligible Pages: ${placement.eligible_pages.length}\n`);
    
    for (const page of placement.eligible_pages.slice(0, 3)) {
      console.log(`  📍 ${page.pattern}`);
      console.log(`     Eligibility Score: ${page.eligibility_score}%`);
      console.log(`     DOM Selector: ${page.dom_placement.selector}`);
      console.log(`     Position: ${page.dom_placement.position}`);
      console.log(`     Mobile Ready: ${page.mobile_ready ? 'Yes' : 'No'}`);
      console.log('');
    }
    
    if (placement.placement_recommendations) {
      console.log(`  Recommendations:`);
      placement.placement_recommendations.forEach(rec => {
        console.log(`    ${rec.priority} ${rec.message}`);
        console.log(`      → ${rec.action}`);
      });
      console.log('');
    }
  }
  
  printCompetitorIntelligence(competitorIntelligence) {
    if (!competitorIntelligence || !competitorIntelligence.competitors) {
      console.log(`  ⚠️  No competitor data available\n`);
      return;
    }
    
    const competitors = competitorIntelligence.competitors;
    
    if (competitors.length === 0) {
      console.log(`  ✅ No competitors detected - clean deployment opportunity\n`);
      return;
    }
    
    console.log(`  🎯 Competitors Detected: ${competitors.length}\n`);
    
    for (const competitor of competitors) {
      console.log(`  📊 ${competitor.name}`);
      console.log(`     Category: ${competitor.category}`);
      console.log(`     Pages: ${competitor.page_count}`);
      console.log(`     Where: ${competitor.where_on_page || competitor.placement || 'unknown'}`);
      if (competitor.placement_details && competitor.placement_details.location !== 'unknown') {
        console.log(`     Location: ${competitor.placement_details.location}`);
        if (competitor.placement_details.common_locations && competitor.placement_details.common_locations.length > 0) {
          const locations = competitor.placement_details.common_locations.map(l => `${l.location} (${l.count}x)`).join(', ');
          console.log(`     Common locations: ${locations}`);
        }
      }
      if (competitor.sample_selectors && competitor.sample_selectors.length > 0) {
        console.log(`     Selectors: ${competitor.sample_selectors.join(', ')}`);
      }
      if (competitor.sample_pages && competitor.sample_pages.length > 0) {
        console.log(`     Sample pages: ${competitor.sample_pages.slice(0, 2).join(', ')}`);
      }
      console.log(`     Confidence: ${competitor.confidence}\n`);
    }
    
    if (competitorIntelligence.beta_test_opportunities && competitorIntelligence.beta_test_opportunities.length > 0) {
      console.log(`  🎯 Beta Test Opportunities:\n`);
      for (const opp of competitorIntelligence.beta_test_opportunities) {
        console.log(`  ${opp.competitor}`);
        console.log(`    ${opp.message}`);
        console.log(`    → ${opp.action}\n`);
      }
    }
  }
  
  printCompetitorIntelligence_OLD(competitors) {
    if (!competitors || !competitors.competitors) {
      console.log(`  ❌ No competitor intelligence available\n`);
      return;
    }
    
    if (competitors.competitors.length === 0) {
      console.log(`  ✅ No competitors detected\n`);
      return;
    }
    
    console.log(`  Competitors Detected: ${competitors.competitors.length}\n`);
    
    for (const competitor of competitors.competitors) {
      console.log(`  🔍 ${competitor.name}`);
      console.log(`     Pages: ${competitor.page_count}`);
      console.log(`     Placement: ${competitor.placement}`);
      console.log(`     Confidence: ${competitor.confidence}`);
      console.log('');
    }
    
    if (competitors.beta_test_opportunities && competitors.beta_test_opportunities.length > 0) {
      console.log(`  🎯 Beta Test Opportunities:`);
      competitors.beta_test_opportunities.forEach(opp => {
        console.log(`    ${opp.competitor}: ${opp.message}`);
        console.log(`      → ${opp.action}`);
      });
      console.log('');
    }
  }
  
  printDeploymentReadiness(dr) {
    console.log(`  Readiness Score: ${dr.percentage}% (${dr.level})`);
    console.log(`  Estimated Timeline: ${dr.timeline}\n`);
    
    if (dr.quick_wins.length > 0) {
      console.log(`  ✅ Ready:`);
      dr.quick_wins.forEach(win => console.log(`    ${win}`));
      console.log('');
    }
    
    if (dr.blockers.length > 0) {
      console.log(`  ⚠️  Needs Attention:`);
      dr.blockers.forEach(blocker => console.log(`    ${blocker}`));
      console.log('');
    }
    
    console.log(`  🎯 Critical Path to Launch:`);
    dr.critical_path.forEach(step => console.log(`    ${step}`));
    console.log('');
  }
  
  printTrafficSummary(traffic) {
    if (!traffic.distribution) {
      console.log(`  ❌ No traffic data available\n`);
      return;
    }
    
    console.log(`  URLs Analyzed: ${traffic.total_urls}`);
    console.log(`  Confidence: ${traffic.confidence}%\n`);
    console.log(`  Traffic Distribution:\n`);
    
    for (const [sport, data] of Object.entries(traffic.distribution)) {
      const bar = '█'.repeat(Math.round(data.percentage / 2));
      console.log(`    ${data.rank}. ${sport.toUpperCase().padEnd(12)} ${data.percentage}%  ${bar}`);
    }
    
    console.log('');
  }
  
  printPatternSummary(patterns) {
    if (!patterns || patterns.length === 0) {
      console.log(`  ❌ No targeting patterns discovered\n`);
      return;
    }
    
    console.log(`  ✅ Found ${patterns.length} targeting pattern(s)\n`);
    
    for (const pattern of patterns) {
      console.log(`  📋 Pattern: ${pattern.pattern}`);
      console.log(`     Sport: ${pattern.sport || 'general'}`);
      console.log(`     Confidence: ${pattern.confidence}%`);
      console.log(`     URLs: ${pattern.url_count || 0}`);
      console.log(`     Search phrase: ${pattern.search_phrase || 'N/A'}`);
      if (pattern.sample_urls && pattern.sample_urls.length > 0) {
        console.log(`     Sample: ${pattern.sample_urls[0]}`);
      }
      console.log(`     → Use for targeting: /mula target ${pattern.pattern} "${pattern.search_phrase || 'sports merchandise'}"`);
      console.log('');
    }
  }
  
  printPatternSummary_OLD(patterns) {
    if (!patterns || patterns.length === 0) {
      console.log(`  ❌ No patterns discovered\n`);
      return;
    }
    
    console.log(`  Patterns Found: ${patterns.length}\n`);
    
    for (const pattern of patterns.slice(0, 5)) {
      console.log(`  ${pattern.sport.toUpperCase()}`);
      console.log(`    Pattern: ${pattern.pattern}`);
      console.log(`    Confidence: ${pattern.confidence}%`);
      console.log(`    Search: "${pattern.search_phrase}"`);
      console.log(`    Sample: ${pattern.sample_urls[0] || 'N/A'}`);
      console.log('');
    }
  }
  
  printRecommendations(results) {
    if (!results.recommendations || results.recommendations.length === 0) {
      console.log(`  No recommendations generated\n`);
      return;
    }
    
    for (const rec of results.recommendations) {
      console.log(`  ${rec.priority} ${rec.category}`);
      console.log(`    ${rec.message}`);
      console.log(`    → ${rec.action}\n`);
    }
    
    // Overall Status
    console.log(`  ${'─'.repeat(56)}`);
    if (results.deployment_ready) {
      console.log(`  ✅ DEPLOYMENT READY - Proceed with targeting configuration`);
    } else {
      console.log(`  ⚠️  NOT READY - Resolve issues before deploying targeting`);
    }
    console.log(`  ${'─'.repeat(56)}`);
  }
  
  async saveResults(results) {
    const outputDir = path.join(__dirname, '../output');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Sanitize domain for filename (remove protocol, paths, etc.)
    const sanitizedDomain = results.domain
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_');
    
    const outputPath = path.join(outputDir, `${sanitizedDomain}-duke-analysis.json`);
    await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
    
    console.log(`\n💾 Full results saved to: ${outputPath}`);
  }
}

// CLI usage
async function main() {
  const domain = process.argv[2];
  const maxUrls = process.argv[3] ? parseInt(process.argv[3]) : 15000;
  
  if (!domain) {
    console.error('\nUsage: node src/onboard.js <domain> [maxUrls]');
    console.error('Example: node src/onboard.js on3.com 10000\n');
    process.exit(1);
  }
  
  const analyzer = new DukeOnboarding();
  
  try {
    await analyzer.analyze(domain, { maxUrls });
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Onboarding failed: ${error.message}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { DukeOnboarding };

