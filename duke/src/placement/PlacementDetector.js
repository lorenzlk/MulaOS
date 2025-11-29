const axios = require('axios');
const cheerio = require('cheerio');

/**
 * PlacementDetector - Analyzes DOM structure to find optimal SmartScroll placement
 * 
 * Answers: "Where should we place SmartScroll and what pages is it eligible for?"
 * 
 * Detection Criteria:
 * - Article pages (templated structure)
 * - Clean break at end of content (above footer, below content)
 * - DOM structure analysis (content → footer gap)
 * - Mobile vs. desktop placement strategies
 */
class PlacementDetector {
  async analyze(domain, sampleUrls = []) {
    console.log(`  📍 Analyzing DOM structure for SmartScroll placement...`);
    
    const results = {
      eligible_pages: [],
      placement_recommendations: [],
      dom_analysis: {},
      competitor_placements: {}
    };
    
    if (sampleUrls.length === 0) {
      console.log(`  ⚠️  No sample URLs provided for placement analysis`);
      return results;
    }
    
    // Analyze first 5 sample URLs
    const urlsToAnalyze = sampleUrls.slice(0, 5);
    console.log(`  🔍 Analyzing ${urlsToAnalyze.length} sample pages...\n`);
    
    for (const url of urlsToAnalyze) {
      try {
        const fullUrl = url.startsWith('http') ? url : `https://${domain}${url}`;
        const pageAnalysis = await this.analyzePage(fullUrl);
        
        if (pageAnalysis.eligible) {
          results.eligible_pages.push({
            url: url,
            pattern: this.extractPattern(url),
            eligibility_score: pageAnalysis.score,
            dom_placement: pageAnalysis.placement,
            mobile_ready: pageAnalysis.mobile_ready,
            content_break: pageAnalysis.content_break,
            sample_urls: [url]
          });
        }
      } catch (error) {
        console.log(`    ⚠️  Failed to analyze ${url}: ${error.message}`);
      }
    }
    
    // Generate recommendations
    results.placement_recommendations = this.generatePlacementRecommendations(results.eligible_pages);
    
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
      
      // Look for article structure
      const article = $('article').first();
      const mainContent = $('main, .content, .post-content, .article-content, #content').first();
      const content = article.length ? article : mainContent;
      
      if (content.length === 0) {
        return { eligible: false, reason: 'No article/main content found' };
      }
      
      // Check for clean break (content → footer gap)
      const footer = $('footer, .footer, #footer').first();
      const contentEnd = content.last();
      
      // Look for common "end of content" markers
      const endMarkers = [
        '.article-footer',
        '.post-footer',
        '.content-footer',
        '.entry-footer',
        '.author-box',
        '.related-posts',
        '.comments',
        '#comments'
      ];
      
      let contentBreak = null;
      for (const marker of endMarkers) {
        const element = content.find(marker).first();
        if (element.length) {
          contentBreak = {
            selector: marker,
            found: true,
            position: 'within-content'
          };
          break;
        }
      }
      
      // If no end marker, check if there's space before footer
      if (!contentBreak && footer.length) {
        contentBreak = {
          selector: 'footer',
          found: true,
          position: 'before-footer'
        };
      }
      
      // Calculate eligibility score
      let score = 0;
      
      // Article structure (30 points)
      if (article.length) score += 30;
      else if (mainContent.length) score += 20;
      
      // Content break found (40 points)
      if (contentBreak) score += 40;
      
      // No competing widgets (20 points)
      const competingWidgets = this.detectCompetingWidgets($);
      if (competingWidgets.length === 0) score += 20;
      else score += 10; // Partial credit if competitors present
      
      // Mobile responsive (10 points)
      const viewport = $('meta[name="viewport"]').length;
      if (viewport) score += 10;
      
      const eligible = score >= 60;
      
      // Determine placement selector
      let placementSelector = null;
      if (contentBreak && contentBreak.selector !== 'footer') {
        placementSelector = contentBreak.selector;
      } else if (article.length) {
        placementSelector = 'article';
      } else if (mainContent.length) {
        placementSelector = mainContent.attr('class') || mainContent.attr('id') || 'main';
      }
      
      return {
        eligible: eligible,
        score: score,
        placement: {
          selector: placementSelector || 'body',
          position: 'after',
          method: 'insertAfter'
        },
        content_break: contentBreak,
        mobile_ready: viewport > 0,
        competing_widgets: competingWidgets
      };
    } catch (error) {
      return { eligible: false, reason: error.message };
    }
  }
  
  detectCompetingWidgets($) {
    const competitors = [];
    
    // Taboola
    if ($('[id*="taboola"], [class*="taboola"], script[src*="taboola"]').length) {
      competitors.push({ name: 'Taboola', detected: true });
    }
    
    // Outbrain
    if ($('[id*="outbrain"], [class*="outbrain"], script[src*="outbrain"]').length) {
      competitors.push({ name: 'Outbrain', detected: true });
    }
    
    // Revcontent
    if ($('[id*="revcontent"], [class*="revcontent"], script[src*="revcontent"]').length) {
      competitors.push({ name: 'Revcontent', detected: true });
    }
    
    // Content.ad
    if ($('[id*="contentad"], [class*="contentad"], script[src*="contentad"]').length) {
      competitors.push({ name: 'Content.ad', detected: true });
    }
    
    return competitors;
  }
  
  extractPattern(url) {
    // Extract URL pattern (e.g., /teams/*/news/*)
    const path = new URL(url.startsWith('http') ? url : `https://example.com${url}`).pathname;
    
    // Replace common dynamic segments with wildcards
    const pattern = path
      .replace(/\/\d+\//g, '/*/')  // Numbers
      .replace(/\/[a-f0-9]{8,}/g, '/*')  // UUIDs/hashes
      .replace(/\/\d{4}\/\d{2}\/\d{2}\//g, '/*/*/*/')  // Dates
      .replace(/\/[^\/]+-[^\/]+-[^\/]+/g, '/*')  // Slugs with multiple dashes
    
    return pattern;
  }
  
  generatePlacementRecommendations(eligiblePages) {
    const recommendations = [];
    
    if (eligiblePages.length === 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Placement',
        message: 'No eligible pages found for SmartScroll placement',
        action: 'Manual DOM analysis required'
      });
      return recommendations;
    }
    
    const highScore = eligiblePages.filter(p => p.eligibility_score >= 80);
    const mediumScore = eligiblePages.filter(p => p.eligibility_score >= 60 && p.eligibility_score < 80);
    
    if (highScore.length > 0) {
      recommendations.push({
        priority: '✅ READY',
        category: 'Placement',
        message: `${highScore.length} page(s) with high eligibility score (80%+)`,
        action: 'Deploy SmartScroll using recommended DOM selectors'
      });
    }
    
    if (mediumScore.length > 0) {
      recommendations.push({
        priority: '⚠️ MEDIUM',
        category: 'Placement',
        message: `${mediumScore.length} page(s) with medium eligibility score (60-79%)`,
        action: 'Review DOM structure and test placement before full deployment'
      });
    }
    
    // Check for competitor opportunities
    const withCompetitors = eligiblePages.filter(p => 
      p.competing_widgets && p.competing_widgets.length > 0
    );
    
    if (withCompetitors.length > 0) {
      const competitorNames = [...new Set(
        withCompetitors.flatMap(p => 
          p.competing_widgets.map(c => c.name)
        )
      )].join(', ');
      
      recommendations.push({
        priority: '🎯 OPPORTUNITY',
        category: 'Beta Test',
        message: `Competitors detected (${competitorNames}) on ${withCompetitors.length} eligible page(s)`,
        action: 'Propose A/B test against existing competitors'
      });
    }
    
    return recommendations;
  }
}

module.exports = PlacementDetector;

