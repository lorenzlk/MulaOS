const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class GrannyContext {
  async analyze(domain, options = {}) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧠 GRANNY BUSINESS CONTEXT ANALYSIS`);
    console.log(`${'='.repeat(60)}\n`);
    console.log(`Domain: ${domain}`);
    console.log(`Started: ${new Date().toISOString()}\n`);
    
    const results = {
      domain: domain,
      analyzed_at: new Date().toISOString(),
      business_intelligence: null,
      competitive_intelligence: null,
      monetization_maturity: null,
      deployment_readiness: null,
      contextual_intelligence: null,
      temporal_intelligence: null,
      recommendations: []
    };
    
    // Phase 1: Business Intelligence
    console.log(`${'─'.repeat(60)}`);
    console.log(`PHASE 1: BUSINESS INTELLIGENCE`);
    console.log(`${'─'.repeat(60)}\n`);
    
    results.business_intelligence = await this.analyzeBusinessModel(domain);
    this.printBusinessIntelligence(results.business_intelligence);
    
    // Phase 2: Competitive Intelligence (NEW!)
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`PHASE 2: COMPETITIVE INTELLIGENCE`);
    console.log(`${'─'.repeat(60)}\n`);
    
    results.competitive_intelligence = await this.analyzeCompetitors(domain);
    this.printCompetitiveIntelligence(results.competitive_intelligence);
    
    // Phase 3: Monetization Maturity (NEW!)
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`PHASE 3: MONETIZATION MATURITY`);
    console.log(`${'─'.repeat(60)}\n`);
    
    results.monetization_maturity = this.calculateMonetizationMaturity(
      results.business_intelligence,
      results.competitive_intelligence
    );
    this.printMonetizationMaturity(results.monetization_maturity);
    
    // Phase 4: Contextual Intelligence (existing, placeholder)
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`PHASE 4: CONTEXTUAL INTELLIGENCE`);
    console.log(`${'─'.repeat(60)}\n`);
    
    results.contextual_intelligence = await this.analyzeContext(domain);
    this.printContextualIntelligence(results.contextual_intelligence);
    
    // Phase 4b: Generate Search Strategies (NEW!)
    if (results.contextual_intelligence && results.contextual_intelligence.sports_context && results.contextual_intelligence.sports_context.length > 0) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`PHASE 4B: AFFILIATE SEARCH STRATEGIES`);
      console.log(`${'─'.repeat(60)}\n`);
      
      results.search_strategies = this.generateSearchStrategies(results.contextual_intelligence, results.contextual_intelligence.sports_context);
      this.printSearchStrategies(results.search_strategies);
    }
    
    // Phase 5: Temporal Intelligence (existing, placeholder)
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`PHASE 5: TEMPORAL INTELLIGENCE`);
    console.log(`${'─'.repeat(60)}\n`);
    
    results.temporal_intelligence = await this.analyzeOpportunities(domain);
    this.printTemporalIntelligence(results.temporal_intelligence);
    
    // Phase 6: Strategic Recommendations
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`PHASE 6: STRATEGIC RECOMMENDATIONS`);
    console.log(`${'─'.repeat(60)}\n`);
    
    this.generateRecommendations(results);
    this.printRecommendations(results);
    
    // Save results
    await this.saveResults(results);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ CONTEXT ANALYSIS COMPLETE`);
    console.log(`${'='.repeat(60)}\n`);
    
    return results;
  }
  
  printSearchStrategies(strategies) {
    if (!strategies || (!strategies.fanatics.primary_search && !strategies.amazon.primary_search)) {
      return;
    }
    
    console.log(`  🔍 Affiliate-Specific Search Strategies:\n`);
    
    // Fanatics Strategy
    if (strategies.fanatics.primary_search) {
      console.log(`  📦 Fanatics (Impact):`);
      console.log(`     Primary: "${strategies.fanatics.primary_search}"`);
      console.log(`     Filters: ${JSON.stringify(strategies.fanatics.filters)}`);
      console.log(`     Expected: ${strategies.fanatics.expected_products} products`);
      console.log(`     Why: ${strategies.fanatics.reasoning}\n`);
    }
    
    // Amazon Strategy
    if (strategies.amazon.primary_search) {
      console.log(`  🛒 Amazon Associates:`);
      console.log(`     Primary: "${strategies.amazon.primary_search}"`);
      console.log(`     Keywords: ${strategies.amazon.keywords.slice(0, 5).join(', ')}...`);
      console.log(`     Expected: ${strategies.amazon.expected_products} products`);
      console.log(`     Why: ${strategies.amazon.reasoning}\n`);
    }
  }
  
  async analyzeBusinessModel(domain) {
    console.log(`  🔍 Analyzing business model...\n`);
    
    // First, check if we have known domain intelligence
    const knownDomains = this.getKnownDomainIntel(domain);
    if (knownDomains) {
      console.log(`  ✅ Using known domain intelligence for ${domain}`);
      return knownDomains;
    }
    
    // Otherwise, try to detect from homepage
    try {
      const response = await axios.get(`https://${domain}`, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MulaBot/1.0)'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      const business = {
        publisher_type: this.detectPublisherType($, domain),
        revenue_model: this.detectRevenueModel($, domain),
        content_focus: this.detectContentFocus($, domain),
        audience_type: this.detectAudienceType($),
        tech_stack: this.detectTechStack($)
      };
      
      return business;
      
    } catch (error) {
      console.log(`  ⚠️  Could not fetch homepage: ${error.message}`);
      // Return best guess based on domain
      return this.inferFromDomain(domain);
    }
  }
  
  getKnownDomainIntel(domain) {
    const cleanDomain = domain.toLowerCase().replace(/^www\./, '');
    
    const knownPublishers = {
      'on3.com': {
        publisher_type: ['sports_focused', 'content_publisher'],
        revenue_model: ['display_ads', 'affiliate', 'subscription'],
        content_focus: ['sports', 'college sports', 'recruiting'],
        audience_type: 'college sports fans',
        tech_stack: ['Custom CMS', 'Google Tag Manager', 'GAM']
      },
      'essentiallysports.com': {
        publisher_type: ['sports_focused', 'content_publisher'],
        revenue_model: ['display_ads', 'affiliate'],
        content_focus: ['sports', 'news', 'analysis'],
        audience_type: 'sports fans',
        tech_stack: ['WordPress', 'Google Tag Manager']
      },
      'bleacherreport.com': {
        publisher_type: ['sports_focused', 'content_publisher'],
        revenue_model: ['display_ads', 'native advertising'],
        content_focus: ['sports', 'news', 'videos'],
        audience_type: 'mainstream sports fans',
        tech_stack: ['Custom CMS', 'Video Platform']
      },
      'twsn.net': {
        publisher_type: ['sports_focused', 'network'],
        revenue_model: ['display_ads', 'affiliate'],
        content_focus: ['sports', 'team coverage'],
        audience_type: 'dedicated team fans',
        tech_stack: ['WordPress', 'Google Tag Manager']
      }
    };
    
    return knownPublishers[cleanDomain] || null;
  }
  
  inferFromDomain(domain) {
    const lowerDomain = domain.toLowerCase();
    
    // Sports-related domains
    if (lowerDomain.includes('sports') || 
        lowerDomain.includes('athletic') ||
        lowerDomain.includes('team') ||
        lowerDomain.includes('fansite')) {
      return {
        publisher_type: ['sports_focused', 'content_publisher'],
        revenue_model: ['display_ads', 'affiliate'],
        content_focus: ['sports'],
        audience_type: 'sports fans',
        tech_stack: ['unknown']
      };
    }
    
    // Default fallback
    return {
      publisher_type: ['content_publisher'],
      revenue_model: ['display_ads'],
      content_focus: ['general'],
      audience_type: 'general audience',
      tech_stack: ['unknown']
    };
  }
  
  detectPublisherType($, domain) {
    const indicators = [];
    
    // Check meta tags
    if ($('meta[property="og:type"]').attr('content') === 'article') {
      indicators.push('content_publisher');
    }
    
    // Check for sports focus
    const pageText = $('nav a, header a, title').text();
    if (pageText.match(/NFL|NBA|MLB|NHL|Sports|College|Football|Basketball/i)) {
      indicators.push('sports_focused');
    }
    
    // Check domain for hints
    if (domain.includes('sports') || domain.includes('athletic')) {
      indicators.push('sports_focused');
    }
    
    // Default to content publisher if nothing else
    if (indicators.length === 0) {
      indicators.push('content_publisher');
    }
    
    return indicators;
  }
  
  detectRevenueModel($, domain) {
    const models = [];
    
    // Check for ads (common ad networks)
    const adScriptPatterns = [
      'doubleclick',
      'googlesyndication',
      'googletagmanager',
      'pbjs', // Prebid
      'adnxs', // AppNexus
      'amazon-adsystem',
      'criteo',
      'taboola',
      'outbrain'
    ];
    
    let hasAds = false;
    adScriptPatterns.forEach(pattern => {
      if ($(`script[src*="${pattern}"]`).length > 0) {
        hasAds = true;
      }
    });
    
    if (hasAds) {
      models.push('display_ads');
    }
    
    // Check for affiliate links (common affiliate networks)
    const affiliatePatterns = [
      'amazon',
      'affiliate',
      'impact.com',
      'shareasale',
      'cj.com',
      'avantlink',
      'rakuten',
      'pepperjam',
      'fanatics.com',
      'trackonomics'
    ];
    
    let hasAffiliate = false;
    affiliatePatterns.forEach(pattern => {
      if ($(`a[href*="${pattern}"]`).length > 0) {
        hasAffiliate = true;
      }
    });
    
    if (hasAffiliate) {
      models.push('affiliate');
    }
    
    // Check for subscription
    if ($('a[href*="subscribe"], a[href*="join"], a[href*="membership"], button:contains("Subscribe")').length > 0) {
      models.push('subscription');
    }
    
    // Infer from domain type if no detection
    if (models.length === 0) {
      if (domain.includes('sports') || domain.includes('athletic')) {
        models.push('display_ads');
        models.push('affiliate');
      } else {
        models.push('display_ads');
      }
    }
    
    return models;
  }
  
  detectContentFocus($, domain) {
    const title = $('title').text().toLowerCase();
    const description = $('meta[name="description"]').attr('content') || '';
    const combined = title + ' ' + description.toLowerCase();
    
    const focuses = [];
    
    // Check content
    if (combined.match(/sports|football|basketball|baseball|hockey|soccer|nfl|nba|mlb|nhl/i)) {
      focuses.push('sports');
    }
    if (combined.match(/news/i)) {
      focuses.push('news');
    }
    if (combined.match(/entertainment/i)) {
      focuses.push('entertainment');
    }
    if (combined.match(/lifestyle/i)) {
      focuses.push('lifestyle');
    }
    
    // Check domain
    if (domain.includes('sports') || domain.includes('athletic')) {
      if (!focuses.includes('sports')) {
        focuses.push('sports');
      }
    }
    
    return focuses.length > 0 ? focuses : ['general'];
  }
  
  detectAudienceType($) {
    // Placeholder - would analyze content tone, topics, etc.
    return 'mass_market'; // vs. 'niche', 'professional', etc.
  }
  
  detectTechStack($) {
    const stack = [];
    
    // WordPress
    if ($('meta[name="generator"]').attr('content')?.includes('WordPress') ||
        $('script[src*="wp-content"]').length > 0 ||
        $('link[href*="wp-content"]').length > 0) {
      stack.push('WordPress');
    }
    
    // Other popular CMSs
    if ($('meta[name="generator"]').attr('content')?.includes('Drupal')) {
      stack.push('Drupal');
    }
    
    if ($('script[src*="squarespace"]').length > 0) {
      stack.push('Squarespace');
    }
    
    if ($('meta[name="generator"]').attr('content')?.includes('Wix')) {
      stack.push('Wix');
    }
    
    // Frameworks
    if ($('script[src*="react"]').length > 0 || $('[data-reactroot], [data-reactid]').length > 0) {
      stack.push('React');
    }
    
    if ($('script[src*="vue"]').length > 0 || $('[data-v-]').length > 0) {
      stack.push('Vue.js');
    }
    
    // Analytics & Tag Managers
    if ($('script[src*="googletagmanager"]').length > 0) {
      stack.push('Google Tag Manager');
    }
    
    if ($('script[src*="google-analytics"], script[src*="gtag"]').length > 0) {
      stack.push('Google Analytics');
    }
    
    return stack.length > 0 ? stack : ['unknown'];
  }
  
  async analyzeCompetitors(domain) {
    console.log(`  🔍 Detecting competing monetization solutions...\n`);
    
    try {
      const response = await axios.get(`https://${domain}`, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MulaBot/1.0)'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      const competitors = {
        content_recommendation: [],
        ad_networks: [],
        affiliate_platforms: [],
        analytics: [],
        optimization: []
      };
      
      // Content Recommendation Widgets
      const contentRecPatterns = {
        'taboola.com': 'Taboola',
        'outbrain.com': 'Outbrain',
        'revcontent.com': 'RevContent',
        'content.ad': 'Content.ad',
        'mgid.com': 'MGID'
      };
      
      // Ad Networks & Management
      const adNetworkPatterns = {
        'googlesyndication.com': 'Google AdSense',
        'doubleclick.net': 'Google Ad Manager (GAM)',
        'amazon-adsystem.com': 'Amazon Native Shopping Ads',
        'mediavine.com': 'Mediavine',
        'ezoic.com': 'Ezoic',
        'adthrive.com': 'AdThrive',
        'criteo.com': 'Criteo',
        'prebid': 'Prebid.js (Header Bidding)'
      };
      
      // Affiliate Platforms
      const affiliatePatterns = {
        'impact.com': 'Impact',
        'shareasale.com': 'ShareASale',
        'cj.com': 'CJ Affiliate',
        'skimlinks.com': 'Skimlinks',
        'viglink.com': 'VigLink',
        'refersion.com': 'Refersion',
        'pepperjam.com': 'Pepperjam',
        'rakuten.com': 'Rakuten Advertising'
      };
      
      // Analytics & Tag Management
      const analyticsPatterns = {
        'googletagmanager.com': 'Google Tag Manager',
        'google-analytics.com': 'Google Analytics',
        'gtag': 'Google Analytics 4',
        'segment.com': 'Segment',
        'mixpanel.com': 'Mixpanel'
      };
      
      // Optimization & Testing
      const optimizationPatterns = {
        'optimizely.com': 'Optimizely',
        'vwo.com': 'VWO',
        'ab-tasty.com': 'AB Tasty',
        'google-optimize': 'Google Optimize'
      };
      
      // Detect all competitors
      const html = $.html();
      
      Object.entries(contentRecPatterns).forEach(([pattern, name]) => {
        if (html.includes(pattern)) competitors.content_recommendation.push(name);
      });
      
      Object.entries(adNetworkPatterns).forEach(([pattern, name]) => {
        if (html.includes(pattern)) competitors.ad_networks.push(name);
      });
      
      Object.entries(affiliatePatterns).forEach(([pattern, name]) => {
        if (html.includes(pattern)) competitors.affiliate_platforms.push(name);
      });
      
      Object.entries(analyticsPatterns).forEach(([pattern, name]) => {
        if (html.includes(pattern)) competitors.analytics.push(name);
      });
      
      Object.entries(optimizationPatterns).forEach(([pattern, name]) => {
        if (html.includes(pattern)) competitors.optimization.push(name);
      });
      
      // Calculate competitive density
      const totalCompetitors = 
        competitors.content_recommendation.length +
        competitors.ad_networks.length +
        competitors.affiliate_platforms.length;
      
      const density = totalCompetitors >= 5 ? 'crowded' : 
                      totalCompetitors >= 3 ? 'moderate' : 'opportunity';
      
      return {
        ...competitors,
        total_competitors: totalCompetitors,
        density: density,
        mula_positioning: this.generateMulaPositioning(competitors, density)
      };
      
    } catch (error) {
      console.log(`  ⚠️  Could not analyze competitors: ${error.message}`);
      return {
        content_recommendation: [],
        ad_networks: [],
        affiliate_platforms: [],
        analytics: [],
        optimization: [],
        total_competitors: 0,
        density: 'unknown',
        error: error.message
      };
    }
  }
  
  generateMulaPositioning(competitors, density) {
    if (density === 'crowded') {
      return 'Complement existing solutions with team-specific, contextual targeting';
    } else if (density === 'moderate') {
      return 'Fill gaps in affiliate monetization with AI-powered product discovery';
    } else {
      return 'Prime opportunity - low competitive density, high potential for affiliate revenue';
    }
  }
  
  calculateMonetizationMaturity(businessIntel, competitiveIntel) {
    let score = 0;
    const factors = [];
    
    // Ad Sophistication (0-3 points)
    if (competitiveIntel.ad_networks.includes('Google Ad Manager (GAM)') ||
        competitiveIntel.ad_networks.includes('Prebid.js (Header Bidding)')) {
      score += 3;
      factors.push('✅ Advanced programmatic ads');
    } else if (competitiveIntel.ad_networks.includes('Google AdSense')) {
      score += 2;
      factors.push('✅ Basic programmatic ads');
    } else if (businessIntel.revenue_model.includes('display_ads')) {
      score += 1;
      factors.push('⚠️ Display ads present but not detected');
    }
    
    // Affiliate Sophistication (0-3 points)
    if (competitiveIntel.affiliate_platforms.length >= 2) {
      score += 3;
      factors.push('✅ Multiple affiliate networks');
    } else if (competitiveIntel.affiliate_platforms.length === 1) {
      score += 2;
      factors.push('✅ Single affiliate network');
    } else if (businessIntel.revenue_model.includes('affiliate')) {
      score += 1;
      factors.push('⚠️ Affiliate present but not detected');
    }
    
    // Tech Sophistication (0-2 points)
    if (competitiveIntel.analytics.includes('Google Tag Manager')) {
      score += 2;
      factors.push('✅ Tag management deployed');
    } else if (competitiveIntel.analytics.includes('Google Analytics')) {
      score += 1;
      factors.push('✅ Basic analytics');
    }
    
    // Optimization Tools (0-2 points)
    if (competitiveIntel.optimization.length > 0) {
      score += 2;
      factors.push('✅ A/B testing platform detected');
    } else {
      factors.push('❌ No A/B testing detected');
    }
    
    // Content Recommendation (bonus insight, not scored)
    if (competitiveIntel.content_recommendation.length > 0) {
      factors.push(`ℹ️ Content widgets: ${competitiveIntel.content_recommendation.join(', ')}`);
    } else {
      factors.push('💡 No content recommendation widgets - opportunity for Mula');
    }
    
    const level = score >= 8 ? 'Advanced' : score >= 5 ? 'Intermediate' : 'Beginner';
    
    return {
      score: score,
      max_score: 10,
      level: level,
      factors: factors,
      insights: this.generateMaturityInsights(score, level, factors)
    };
  }
  
  generateMaturityInsights(score, level, factors) {
    const insights = [];
    
    if (level === 'Advanced') {
      insights.push('Strong monetization foundation - fast deployment expected');
      insights.push('Team understands revenue optimization - minimal hand-holding');
      insights.push('High expectations - must demonstrate clear incremental value');
    } else if (level === 'Intermediate') {
      insights.push('Solid foundation - deployment timeline: 1-2 weeks');
      insights.push('Some guidance needed on advanced features');
      insights.push('Good opportunity to show optimization wins');
    } else {
      insights.push('Basic setup - deployment timeline: 2-4 weeks');
      insights.push('More hand-holding required for success');
      insights.push('Focus on education and quick wins');
    }
    
    // Missing A/B testing is always an opportunity
    if (!factors.some(f => f.includes('A/B testing platform'))) {
      insights.push('Missing A/B testing - Mula can provide data-driven optimization');
    }
    
    return insights;
  }
  
  async analyzeContext(domain) {
    console.log(`  🌍 Analyzing contextual positioning...\n`);
    
    // Get known domain context first
    const knownContext = this.getKnownDomainContext(domain);
    if (knownContext) {
      console.log(`  ✅ Using known domain context for ${domain}`);
      
      // Enrich with real-time sports context
      const sportsContext = await this.getSportsContext(knownContext.primary_sports);
      
      return {
        ...knownContext,
        sports_context: sportsContext,
        opportunities: this.identifyOpportunities(knownContext, sportsContext)
      };
    }
    
    // Fallback: generic context analysis
    return {
      status: 'limited',
      message: 'Domain not in known publishers database',
      sports_context: [],
      opportunities: []
    };
  }
  
  getKnownDomainContext(domain) {
    const cleanDomain = domain.toLowerCase().replace(/^www\./, '');
    
    const knownContexts = {
      'on3.com': {
        primary_sports: ['cfb', 'college-basketball', 'recruiting'],
        audience: 'college sports fans',
        focus: 'team-specific coverage',
        key_teams: [
          { name: 'Ohio State', sport: 'cfb', rivals: ['Michigan', 'Penn State'] },
          { name: 'Alabama', sport: 'cfb', rivals: ['Auburn', 'LSU', 'Tennessee'] },
          { name: 'Michigan', sport: 'cfb', rivals: ['Ohio State', 'Michigan State'] },
          { name: 'Georgia', sport: 'cfb', rivals: ['Florida', 'Auburn'] }
        ],
        seasonal_peaks: ['football-season', 'rivalry-week', 'playoffs', 'recruiting-periods']
      },
      'essentiallysports.com': {
        primary_sports: ['nfl', 'nba', 'boxing', 'ufc', 'tennis', 'golf'],
        audience: 'mainstream sports fans',
        focus: 'multi-sport coverage',
        key_events: ['super-bowl', 'nba-finals', 'major-boxing-matches', 'ufc-ppv', 'grand-slams'],
        seasonal_peaks: ['football-season', 'basketball-season', 'playoff-seasons']
      },
      'bleacherreport.com': {
        primary_sports: ['nfl', 'nba', 'mlb', 'nhl', 'soccer'],
        audience: 'mainstream sports fans',
        focus: 'breaking news and analysis',
        seasonal_peaks: ['all-major-sports-seasons', 'playoffs', 'championships']
      }
    };
    
    return knownContexts[cleanDomain] || null;
  }
  
  async getSportsContext(sports) {
    // This would integrate with ESPN API, but for now we'll use smart heuristics
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0-11
    const currentDay = currentDate.getDate();
    
    const contexts = [];
    
    if (sports.includes('cfb')) {
      // College Football season: Aug-Jan
      if (currentMonth >= 7 || currentMonth <= 0) {
        contexts.push({
          sport: 'cfb',
          season: 'active',
          phase: this.getCFBPhase(currentMonth),
          opportunities: this.getCFBOpportunities(currentMonth, currentDay)
        });
      }
    }
    
    if (sports.includes('nfl')) {
      // NFL season: Sept-Feb
      if (currentMonth >= 8 || currentMonth <= 1) {
        contexts.push({
          sport: 'nfl',
          season: 'active',
          phase: this.getNFLPhase(currentMonth),
          opportunities: ['game-day-merchandise', 'playoff-gear']
        });
      }
    }
    
    if (sports.includes('nba') || sports.includes('college-basketball')) {
      // Basketball season: Oct-June
      if (currentMonth >= 9 || currentMonth <= 5) {
        contexts.push({
          sport: sports.includes('nba') ? 'nba' : 'college-basketball',
          season: 'active',
          phase: this.getBasketballPhase(currentMonth),
          opportunities: ['game-day-gear', 'playoff-merchandise']
        });
      }
    }
    
    return contexts;
  }
  
  getCFBPhase(month) {
    if (month === 7 || month === 8) return 'preseason';
    if (month === 9 || month === 10) return 'regular-season';
    if (month === 11) return 'rivalry-week-and-conference-championships';
    if (month === 0) return 'playoff-season';
    return 'offseason';
  }
  
  getCFBOpportunities(month, day) {
    const opportunities = [];
    
    // Rivalry Week (typically last week of November)
    if (month === 10 && day >= 20) {
      opportunities.push({
        type: 'rivalry-week',
        urgency: 'high',
        recommendation: 'Switch to rivalry-specific merchandise (e.g., "Beat Michigan", "Beat Auburn")',
        expected_lift: '2-4x CTR vs. generic team merchandise',
        duration: '7 days'
      });
    }
    
    // Conference Championship Week
    if (month === 11 && day <= 7) {
      opportunities.push({
        type: 'conference-championships',
        urgency: 'high',
        recommendation: 'Feature championship gear for teams still playing',
        expected_lift: '1.5-2x CTR',
        duration: '3 days'
      });
    }
    
    // Playoff Season
    if (month === 0) {
      opportunities.push({
        type: 'cfp-playoffs',
        urgency: 'critical',
        recommendation: 'Championship merchandise for playoff teams',
        expected_lift: '3-5x CTR',
        duration: '14 days'
      });
    }
    
    // Regular season (always applicable)
    if (opportunities.length === 0) {
      opportunities.push({
        type: 'regular-season',
        urgency: 'medium',
        recommendation: 'Team-specific merchandise with game-day focus',
        expected_lift: '1.2-1.5x vs. generic',
        duration: 'ongoing'
      });
    }
    
    return opportunities;
  }
  
  getNFLPhase(month) {
    if (month === 8) return 'early-season';
    if (month === 9 || month === 10) return 'mid-season';
    if (month === 11) return 'playoff-push';
    if (month === 0 || month === 1) return 'playoffs-and-super-bowl';
    return 'offseason';
  }
  
  getBasketballPhase(month) {
    if (month === 9 || month === 10) return 'early-season';
    if (month === 11 || month === 0 || month === 1) return 'mid-season';
    if (month === 2) return 'march-madness';
    if (month === 3 || month === 4) return 'playoffs';
    if (month === 5) return 'finals';
    return 'offseason';
  }
  
  identifyOpportunities(domainContext, sportsContext) {
    const opportunities = [];
    
    // Extract all opportunities from sports contexts
    sportsContext.forEach(ctx => {
      if (ctx.opportunities && Array.isArray(ctx.opportunities)) {
        ctx.opportunities.forEach(opp => {
          if (typeof opp === 'object') {
            opportunities.push({
              ...opp,
              sport: ctx.sport,
              phase: ctx.phase
            });
          }
        });
      }
    });
    
    // Add team-specific opportunities if available
    if (domainContext.key_teams) {
      domainContext.key_teams.forEach(team => {
        opportunities.push({
          type: 'team-rivalry-detection',
          team: team.name,
          rivals: team.rivals,
          recommendation: `Create rivalry-specific feeds when ${team.name} plays ${team.rivals.join(' or ')}`,
          urgency: 'high',
          expected_lift: '2-4x CTR during rivalry games'
        });
      });
    }
    
    return opportunities;
  }
  
  generateSearchStrategies(domainContext, sportsContext) {
    // Generate affiliate-specific search strategies based on context
    const strategies = {
      fanatics: {},
      amazon: {}
    };
    
    // Determine current context type
    const contextType = this.determineContextType(sportsContext);
    
    if (contextType.isRivalryWeek && domainContext.key_teams) {
      // RIVALRY WEEK CONTEXT
      const team = domainContext.key_teams[0]; // Primary team
      
      strategies.fanatics = {
        primary_search: `Beat ${team.rivals[0]}`,
        secondary_search: `${team.name} Rivalry`,
        filters: {
          sport: contextType.sport,
          team: this.normalizeTeamName(team.name),
          tags: ['rivalry', team.rivals[0].toLowerCase()]
        },
        boost_keywords: ['beat', 'rivalry', 'game day'],
        reasoning: 'Fanatics has specific rivalry merchandise collections',
        expected_products: '15-25'
      };
      
      strategies.amazon = {
        primary_search: `${team.name} beat ${team.rivals[0]} rivalry shirt`,
        secondary_search: `${team.name} ${team.rivals[0]} game day apparel`,
        keywords: [
          team.name.toLowerCase(),
          `beat ${team.rivals[0].toLowerCase()}`,
          'rivalry',
          this.getTeamNickname(team.name),
          'shirt',
          'apparel',
          'fan gear'
        ],
        category_hints: ['sports fan shop', 'clothing', 'novelty'],
        reasoning: 'Amazon search requires descriptive, keyword-rich queries',
        expected_products: '20-40'
      };
      
    } else if (contextType.isChampionship && domainContext.key_teams) {
      // CHAMPIONSHIP CONTEXT
      const team = domainContext.key_teams[0];
      
      strategies.fanatics = {
        primary_search: `${team.name} Champions`,
        secondary_search: `${team.name} Championship`,
        filters: {
          sport: contextType.sport,
          team: this.normalizeTeamName(team.name),
          type: 'championship'
        },
        boost_keywords: ['champions', 'championship', 'playoff'],
        reasoning: 'Championship merchandise during playoff season',
        expected_products: '10-20'
      };
      
      strategies.amazon = {
        primary_search: `${team.name} national champions ${contextType.sport} championship gear`,
        secondary_search: `${team.name} playoff champions merchandise`,
        keywords: [
          team.name.toLowerCase(),
          'national champions',
          'championship',
          contextType.sport,
          this.getTeamNickname(team.name)
        ],
        category_hints: ['sports fan shop', 'championship gear'],
        reasoning: 'Championship-focused search for Amazon',
        expected_products: '15-30'
      };
      
    } else if (domainContext.key_teams) {
      // REGULAR SEASON / GENERIC CONTEXT
      const team = domainContext.key_teams[0];
      
      strategies.fanatics = {
        primary_search: team.name,
        secondary_search: `${team.name} Merchandise`,
        filters: {
          sport: domainContext.primary_sports[0],
          team: this.normalizeTeamName(team.name)
        },
        boost_keywords: ['official', 'licensed'],
        reasoning: 'Generic team merchandise for regular season',
        expected_products: '20-40'
      };
      
      strategies.amazon = {
        primary_search: `${team.name} ${this.getTeamNickname(team.name)} merchandise fan gear`,
        secondary_search: `${team.name} apparel`,
        keywords: [
          team.name.toLowerCase(),
          this.getTeamNickname(team.name),
          'fan',
          'merchandise',
          'apparel'
        ],
        category_hints: ['sports fan shop'],
        reasoning: 'Generic team merchandise search for Amazon',
        expected_products: '30-50'
      };
    }
    
    // Fallback strategies
    strategies.fallback = {
      fanatics: {
        search: 'Sports Merchandise',
        filters: { sport: domainContext.primary_sports[0] }
      },
      amazon: {
        search: 'sports fan gear',
        category: 'sports fan shop'
      }
    };
    
    return strategies;
  }
  
  determineContextType(sportsContext) {
    const result = {
      isRivalryWeek: false,
      isChampionship: false,
      sport: null
    };
    
    if (!sportsContext || sportsContext.length === 0) {
      return result;
    }
    
    const primaryContext = sportsContext[0];
    result.sport = primaryContext.sport;
    
    // Check for rivalry week
    if (primaryContext.phase && primaryContext.phase.includes('rivalry')) {
      result.isRivalryWeek = true;
    }
    
    // Check for championship
    if (primaryContext.phase && 
        (primaryContext.phase.includes('championship') || 
         primaryContext.phase.includes('playoff'))) {
      result.isChampionship = true;
    }
    
    // Check opportunities for rivalry week
    if (primaryContext.opportunities) {
      primaryContext.opportunities.forEach(opp => {
        if (opp.type === 'rivalry-week') {
          result.isRivalryWeek = true;
        }
        if (opp.type === 'cfp-playoffs' || opp.type === 'conference-championships') {
          result.isChampionship = true;
        }
      });
    }
    
    return result;
  }
  
  normalizeTeamName(teamName) {
    // Convert "Ohio State" -> "ohio-state" for filters
    return teamName.toLowerCase().replace(/\s+/g, '-');
  }
  
  getTeamNickname(teamName) {
    const nicknames = {
      'Ohio State': 'buckeyes',
      'Michigan': 'wolverines',
      'Alabama': 'crimson tide',
      'Georgia': 'bulldogs',
      'Auburn': 'tigers',
      'LSU': 'tigers',
      'Tennessee': 'volunteers',
      'Penn State': 'nittany lions',
      'Michigan State': 'spartans',
      'Florida': 'gators'
    };
    
    return nicknames[teamName] || teamName.toLowerCase();
  }
  
  async analyzeOpportunities(domain) {
    console.log(`  📅 Analyzing upcoming opportunities...\n`);
    
    // This would:
    // - Check sports calendar for upcoming events
    // - Identify seasonal peaks
    // - Predict high-traffic windows
    // For now, placeholder
    
    return {
      status: 'placeholder',
      message: 'Opportunity calendar, seasonal peaks, event detection - to be built'
    };
  }
  
  generateRecommendations(results) {
    const recs = [];
    
    if (results.business_intelligence) {
      const bi = results.business_intelligence;
      
      if (bi.revenue_model?.includes('affiliate')) {
        recs.push({
          priority: '✅ ALIGNED',
          category: 'Revenue Model',
          message: 'Publisher already uses affiliate links - Mula is a natural fit',
          action: 'Position as "smarter affiliate strategy"'
        });
      }
      
      if (bi.publisher_type?.includes('sports_focused')) {
        recs.push({
          priority: '✅ ALIGNED',
          category: 'Content Focus',
          message: 'Sports-focused publisher - perfect fit for Granny contextual intelligence',
          action: 'Leverage sports calendar and rivalry detection'
        });
      }
    }
    
    results.recommendations = recs;
  }
  
  printCompetitiveIntelligence(ci) {
    if (ci.error) {
      console.log(`  ❌ ${ci.error}\n`);
      return;
    }
    
    console.log(`  Total Competitors: ${ci.total_competitors} (${ci.density} market)`);
    console.log(`  Mula Positioning: ${ci.mula_positioning}\n`);
    
    if (ci.content_recommendation.length > 0) {
      console.log(`  Content Recommendation:`);
      ci.content_recommendation.forEach(c => console.log(`    - ${c}`));
      console.log('');
    }
    
    if (ci.ad_networks.length > 0) {
      console.log(`  Ad Networks:`);
      ci.ad_networks.forEach(c => console.log(`    - ${c}`));
      console.log('');
    }
    
    if (ci.affiliate_platforms.length > 0) {
      console.log(`  Affiliate Platforms:`);
      ci.affiliate_platforms.forEach(c => console.log(`    - ${c}`));
      console.log('');
    }
    
    if (ci.analytics.length > 0) {
      console.log(`  Analytics & Tag Management:`);
      ci.analytics.forEach(c => console.log(`    - ${c}`));
      console.log('');
    }
    
    if (ci.optimization.length > 0) {
      console.log(`  Optimization Tools:`);
      ci.optimization.forEach(c => console.log(`    - ${c}`));
      console.log('');
    }
  }
  
  printMonetizationMaturity(mm) {
    console.log(`  Score: ${mm.score}/${mm.max_score} (${mm.level})\n`);
    
    console.log(`  Factors:`);
    mm.factors.forEach(f => console.log(`    ${f}`));
    console.log('');
    
    console.log(`  Insights:`);
    mm.insights.forEach(i => console.log(`    • ${i}`));
    console.log('');
  }
  
  printBusinessIntelligence(bi) {
    if (bi.error) {
      console.log(`  ❌ ${bi.error}\n`);
      return;
    }
    
    console.log(`  Publisher Type: ${bi.publisher_type?.join(', ') || 'Unknown'}`);
    console.log(`  Revenue Model: ${bi.revenue_model?.join(', ') || 'Unknown'}`);
    console.log(`  Content Focus: ${bi.content_focus?.join(', ') || 'Unknown'}`);
    console.log(`  Audience Type: ${bi.audience_type || 'Unknown'}`);
    console.log(`  Tech Stack: ${bi.tech_stack?.join(', ') || 'Unknown'}\n`);
  }
  
  printContextualIntelligence(ci) {
    if (ci.status === 'placeholder' || ci.status === 'limited') {
      console.log(`  ⏳ ${ci.message || 'Limited context available'}\n`);
      return;
    }
    
    console.log(`  Focus: ${ci.focus}`);
    console.log(`  Audience: ${ci.audience}\n`);
    
    if (ci.sports_context && ci.sports_context.length > 0) {
      console.log(`  Active Sports Seasons:`);
      ci.sports_context.forEach(ctx => {
        console.log(`    • ${ctx.sport.toUpperCase()} - ${ctx.phase}`);
      });
      console.log('');
    }
    
    if (ci.opportunities && ci.opportunities.length > 0) {
      console.log(`  🎯 Current Opportunities:`);
      ci.opportunities.slice(0, 5).forEach((opp, index) => {
        console.log(`    ${index + 1}. ${opp.type || 'Opportunity'}`);
        if (opp.recommendation) {
          console.log(`       → ${opp.recommendation}`);
        }
        if (opp.expected_lift) {
          console.log(`       Expected: ${opp.expected_lift}`);
        }
      });
      console.log('');
    }
  }
  
  printTemporalIntelligence(ti) {
    if (ti.status === 'placeholder') {
      console.log(`  ⏳ ${ti.message}\n`);
    }
  }
  
  printRecommendations(results) {
    if (!results.recommendations || results.recommendations.length === 0) {
      console.log(`  ⏳ No recommendations yet (context analysis in progress)\n`);
      return;
    }
    
    for (const rec of results.recommendations) {
      console.log(`  ${rec.priority} ${rec.category}`);
      console.log(`    ${rec.message}`);
      console.log(`    → ${rec.action}\n`);
    }
  }
  
  async saveResults(results) {
    const outputDir = path.join(__dirname, '../output');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, `${results.domain}-granny-context.json`);
    await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
    
    console.log(`💾 Full results saved to: ${outputPath}`);
  }
}

// CLI usage
async function main() {
  const domain = process.argv[2];
  
  if (!domain) {
    console.error('\nUsage: node src/context.js <domain>');
    console.error('Example: node src/context.js essentiallysports.com\n');
    process.exit(1);
  }
  
  const analyzer = new GrannyContext();
  
  try {
    await analyzer.analyze(domain);
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Context analysis failed: ${error.message}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { GrannyContext };

