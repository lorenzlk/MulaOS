const axios = require('axios');
const cheerio = require('cheerio');

/**
 * CompetitorDetector - Detects competing native ad networks
 * 
 * Detects:
 * - Taboola
 * - Outbrain
 * - Revcontent
 * - Content.ad
 * - Other native ad widgets
 * 
 * Strategy: If competitors running → Ask for beta test against them
 */
class CompetitorDetector {
  async analyze(domain, sampleUrls = []) {
    console.log(`  🔍 Detecting competing native ad networks...`);
    
    const results = {
      competitors: [],
      placement_map: {},
      beta_test_opportunities: [],
      inventory_overlap: {}
    };
    
    if (sampleUrls.length === 0) {
      console.log(`  ⚠️  No sample URLs provided for competitor analysis`);
      return results;
    }
    
    // Analyze first 5 sample URLs
    const urlsToAnalyze = sampleUrls.slice(0, 5);
    console.log(`  🔍 Analyzing ${urlsToAnalyze.length} sample pages...\n`);
    
    const competitorCounts = {};
    
    for (const url of urlsToAnalyze) {
      try {
        const fullUrl = url.startsWith('http') ? url : `https://${domain}${url}`;
        const pageCompetitors = await this.analyzePage(fullUrl);
        
        for (const competitor of pageCompetitors) {
          if (!competitorCounts[competitor.name]) {
            competitorCounts[competitor.name] = {
              count: 0,
              pages: [],
              placements: []
            };
          }
          
          competitorCounts[competitor.name].count++;
          competitorCounts[competitor.name].pages.push(url);
          
          if (competitor.placement) {
            competitorCounts[competitor.name].placements.push(competitor.placement);
          }
        }
      } catch (error) {
        console.log(`    ⚠️  Failed to analyze ${url}: ${error.message}`);
      }
    }
    
    // Format results
    results.competitors = Object.entries(competitorCounts).map(([name, data]) => ({
      name: name,
      detected: true,
      page_count: data.count,
      sample_pages: data.pages.slice(0, 3),
      placement: this.determinePlacement(data.placements),
      confidence: data.count >= 3 ? 'high' : data.count >= 1 ? 'medium' : 'low'
    }));
    
    // Generate beta test opportunities
    results.beta_test_opportunities = this.generateBetaTestOpportunities(results.competitors);
    
    // Map inventory overlap
    results.inventory_overlap = this.mapInventoryOverlap(results.competitors, sampleUrls);
    
    return results;
  }
  
  async analyzePage(url) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MulaBot/1.0)'
        }
      });
      
      const $ = cheerio.load(response.data);
      const competitors = [];
      
      // Taboola
      if ($('[id*="taboola"], [class*="taboola"]').length || 
          $('script[src*="taboola"]').length ||
          $('script').toArray().some(script => $(script).html()?.includes('taboola'))) {
        const placement = this.findPlacement($, 'taboola');
        competitors.push({
          name: 'Taboola',
          detected: true,
          placement: placement
        });
      }
      
      // Outbrain
      if ($('[id*="outbrain"], [class*="outbrain"]').length ||
          $('script[src*="outbrain"]').length ||
          $('script').toArray().some(script => $(script).html()?.includes('outbrain'))) {
        const placement = this.findPlacement($, 'outbrain');
        competitors.push({
          name: 'Outbrain',
          detected: true,
          placement: placement
        });
      }
      
      // Revcontent
      if ($('[id*="revcontent"], [class*="revcontent"]').length ||
          $('script[src*="revcontent"]').length) {
        const placement = this.findPlacement($, 'revcontent');
        competitors.push({
          name: 'Revcontent',
          detected: true,
          placement: placement
        });
      }
      
      // Content.ad
      if ($('[id*="contentad"], [class*="contentad"]').length ||
          $('script[src*="contentad"]').length) {
        const placement = this.findPlacement($, 'contentad');
        competitors.push({
          name: 'Content.ad',
          detected: true,
          placement: placement
        });
      }
      
      return competitors;
    } catch (error) {
      return [];
    }
  }
  
  findPlacement($, competitorName) {
    const elements = $(`[id*="${competitorName}"], [class*="${competitorName}"]`);
    
    if (elements.length === 0) {
      return 'unknown';
    }
    
    const firstElement = elements.first();
    const parent = firstElement.parent();
    
    // Determine placement relative to content
    const article = $('article').first();
    const mainContent = $('main, .content').first();
    const content = article.length ? article : mainContent;
    
    if (content.length) {
      const contentBottom = content.offset().top + content.height();
      const competitorTop = firstElement.offset().top;
      
      if (competitorTop > contentBottom) {
        return 'below-content';
      } else if (competitorTop < content.offset().top) {
        return 'above-content';
      } else {
        return 'within-content';
      }
    }
    
    return 'unknown';
  }
  
  determinePlacement(placements) {
    if (placements.length === 0) return 'unknown';
    
    const counts = {};
    for (const placement of placements) {
      counts[placement] = (counts[placement] || 0) + 1;
    }
    
    // Return most common placement
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])[0][0];
  }
  
  generateBetaTestOpportunities(competitors) {
    const opportunities = [];
    
    for (const competitor of competitors) {
      if (competitor.detected && competitor.confidence === 'high') {
        opportunities.push({
          competitor: competitor.name,
          opportunity: 'A/B Test',
          message: `${competitor.name} detected on ${competitor.page_count} pages - ideal for beta test`,
          action: `Propose A/B test: Mula SmartScroll vs. ${competitor.name}`,
          placement: competitor.placement,
          confidence: competitor.confidence
        });
      }
    }
    
    return opportunities;
  }
  
  mapInventoryOverlap(competitors, allUrls) {
    const overlap = {
      total_pages: allUrls.length,
      competitor_pages: 0,
      available_inventory: 0,
      overlap_percentage: 0
    };
    
    if (competitors.length === 0) {
      overlap.available_inventory = allUrls.length;
      overlap.overlap_percentage = 0;
      return overlap;
    }
    
    // Estimate overlap (simplified - would need actual page-by-page analysis)
    const competitorPages = new Set();
    for (const competitor of competitors) {
      for (const page of competitor.sample_pages) {
        competitorPages.add(page);
      }
    }
    
    overlap.competitor_pages = competitorPages.size;
    overlap.available_inventory = allUrls.length - competitorPages.size;
    overlap.overlap_percentage = Math.round((competitorPages.size / allUrls.length) * 100);
    
    return overlap;
  }
}

module.exports = CompetitorDetector;

