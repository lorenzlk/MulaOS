const axios = require('axios');
const cheerio = require('cheerio');

/**
 * CompetitorDetector - Detects competing native / recirc ad networks
 *
 * Detects (by default):
 * - Taboola
 * - Outbrain
 * - Revcontent
 * - Content.ad
 * - ZergNet
 * - Ex.co
 * - Raptive Recirc
 * - Nativo
 * - TripleLift
 * - First-party recirc widgets (data-recommendation / data-recirc)
 *
 * Strategy: If competitors running → Ask for beta test against them
 */

const COMPETITORS = {
  Taboola: {
    patterns: ['taboola'],
    category: 'native',
  },
  Outbrain: {
    patterns: ['outbrain'],
    category: 'native',
  },
  Revcontent: {
    patterns: ['revcontent'],
    category: 'native',
  },
  'Content.ad': {
    patterns: ['contentad'],
    category: 'native',
  },
  ZergNet: {
    patterns: ['zergnet'],
    category: 'native',
  },
  'Ex.co': {
    patterns: ['exco'],
    category: 'video_recirc',
  },
  'Raptive Recirc': {
    patterns: ['raptive'],
    category: 'recirc',
  },
  Nativo: {
    patterns: ['nativo'],
    category: 'native',
  },
  TripleLift: {
    patterns: ['triplelift'],
    category: 'native',
  },
  'First-Party Recirc': {
    patterns: ['data-recommendation', 'data-recirc'],
    category: 'first_party_recirc',
    firstParty: true,
  },
};

class CompetitorDetector {
  async analyze(domain, sampleUrls = []) {
    console.log(`  🔍 Detecting competing native ad networks...`);

    const results = {
      competitors: [],
      placement_map: {},
      beta_test_opportunities: [],
      inventory_overlap: {},
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
              placements: [],
              selectors: [],
              category: competitor.category,
            };
          }

          competitorCounts[competitor.name].count++;
          competitorCounts[competitor.name].pages.push(url);

          if (competitor.placement) {
            competitorCounts[competitor.name].placements.push(competitor.placement);
          }
          
          if (competitor.placement_details) {
            if (!competitorCounts[competitor.name].placement_details) {
              competitorCounts[competitor.name].placement_details = [];
            }
            competitorCounts[competitor.name].placement_details.push(competitor.placement_details);
          }

          if (competitor.selector) {
            competitorCounts[competitor.name].selectors.push(competitor.selector);
          }
          
          if (competitor.element_id) {
            if (!competitorCounts[competitor.name].element_ids) {
              competitorCounts[competitor.name].element_ids = [];
            }
            competitorCounts[competitor.name].element_ids.push(competitor.element_id);
          }
          
          if (competitor.element_class) {
            if (!competitorCounts[competitor.name].element_classes) {
              competitorCounts[competitor.name].element_classes = [];
            }
            competitorCounts[competitor.name].element_classes.push(competitor.element_class);
          }
        }
      } catch (error) {
        console.log(`    ⚠️  Failed to analyze ${url}: ${error.message}`);
      }
    }

    // Format results
    results.competitors = Object.entries(competitorCounts).map(([name, data]) => {
      const placement = this.determinePlacement(data.placements);
      const confidence = data.count >= 3 ? 'high' : data.count >= 1 ? 'medium' : 'low';
      
      // Aggregate placement details
      const placementDetails = this.aggregatePlacementDetails(data.placement_details || []);
      const commonSelectors = Array.from(new Set(data.selectors)).slice(0, 3);
      const commonIds = Array.from(new Set(data.element_ids || [])).filter(Boolean).slice(0, 3);
      const commonClasses = Array.from(new Set(data.element_classes || [])).filter(Boolean).slice(0, 3);

      return {
        name,
        category: data.category || this.getCompetitorCategory(name),
        detected: true,
        page_count: data.count,
        sample_pages: data.pages.slice(0, 3),
        placement: placement || 'unknown', // Legacy field
        placement_details: placementDetails,
        where_on_page: placementDetails.location || placement || 'unknown',
        sample_selectors: commonSelectors,
        element_ids: commonIds,
        element_classes: commonClasses,
        confidence,
      };
    });

    // Build simple placement map for quick inspection
    results.placement_map = results.competitors.reduce((map, competitor) => {
      map[competitor.name] = {
        placement: competitor.placement,
        category: competitor.category,
        sample_pages: competitor.sample_pages,
      };
      return map;
    }, {});

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
          'User-Agent': 'Mozilla/5.0 (compatible; MulaBot/1.0)',
        },
      });

      const $ = cheerio.load(response.data, {
        withStartIndices: true,
        withEndIndices: true,
      });

      const competitors = [];

      // Determine primary content node
      const article = $('article, .article, .story, .post').first();
      const mainContent = $('main, .content, .post-content, .article-content, #content').first();
      const content = article.length ? article : mainContent;

      for (const [name, def] of Object.entries(COMPETITORS)) {
        const detected = this.detectCompetitor($, def, content);
        if (!detected) continue;

        const { element } = detected;
        const placement = this.findPlacement(content, element);
        const selector = this.buildSelector(element);

        // Get more detailed placement info
        const placementDetails = this.getPlacementDetails($, element, content);
        
        competitors.push({
          name,
          category: def.category,
          detected: true,
          placement: placement || 'unknown',
          placement_details: placementDetails,
          selector,
          element_id: element.attr('id') || null,
          element_class: element.attr('class') || null,
        });
      }

      return competitors;
    } catch (error) {
      return [];
    }
  }

  detectCompetitor($, def, contentRoot) {
    // First-party recirc widgets: data attributes
    if (def.firstParty) {
      const elements = $('[data-recommendation], [data-recirc]');
      if (!elements.length) return null;
      return { element: elements.first(), contentRoot };
    }

    const patterns = def.patterns || [];
    let matchedElement = null;

    for (const pattern of patterns) {
      if (matchedElement) break;

      const selectorMatches = $(`*[id*="${pattern}"], *[class*="${pattern}"]`);
      if (selectorMatches.length) {
        matchedElement = selectorMatches.first();
        break;
      }

      const scriptSrcMatches = $(`script[src*="${pattern}"]`);
      if (scriptSrcMatches.length) {
        matchedElement = scriptSrcMatches.first();
        break;
      }

      const scriptTag = $('script').toArray().find((script) => {
        const html = $(script).html() || '';
        return html.includes(pattern);
      });

      if (scriptTag) {
        matchedElement = $(scriptTag);
        break;
      }
    }

    if (!matchedElement) return null;

    return { element: matchedElement, contentRoot };
  }

  findPlacement(content, element) {
    if (!content || !content.length || !element || !element[0]) {
      return 'unknown';
    }

    const contentNode = content[0];
    const elNode = element[0];

    const contentStart = contentNode.startIndex;
    const contentEnd = contentNode.endIndex;
    const elStart = elNode.startIndex;

    if (typeof contentStart === 'number' && typeof elStart === 'number') {
      if (typeof contentEnd === 'number') {
        if (elStart > contentEnd) {
          return 'below-content';
        }
        if (elStart < contentStart) {
          return 'above-content';
        }
        return 'within-content';
      }

      // Fallback: best-effort ordering
      if (elStart < contentStart) return 'above-content';
      return 'within-content';
    }

    // Fallback: DOM containment
    if (content.find('*').toArray().includes(elNode)) {
      return 'within-content';
    }

    return 'unknown';
  }

  determinePlacement(placements) {
    if (!placements || placements.length === 0) return 'unknown';

    const counts = {};
    for (const placement of placements) {
      counts[placement] = (counts[placement] || 0) + 1;
    }

    // Return most common placement
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  generateBetaTestOpportunities(competitors) {
    const opportunities = [];

    for (const competitor of competitors) {
      if (!competitor.detected) continue;
      if (competitor.confidence !== 'high') continue;

      const isFooterOnly = competitor.placement === 'below-content';
      const isInline = competitor.placement === 'within-content';

      let strategy = 'A/B Test';
      if (isInline) {
        strategy = 'Inline A/B Test';
      } else if (isFooterOnly) {
        strategy = 'Footer A/B Test';
      }

      opportunities.push({
        competitor: competitor.name,
        category: competitor.category,
        opportunity: strategy,
        message: `${competitor.name} detected on ${competitor.page_count} pages - ideal for beta test`,
        action: `Propose A/B test: Mula SmartScroll vs. ${competitor.name} in ${competitor.placement} slot`,
        placement: competitor.placement,
        confidence: competitor.confidence,
      });
    }

    return opportunities;
  }

  mapInventoryOverlap(competitors, allUrls) {
    const overlap = {
      total_pages: allUrls.length,
      competitor_pages: 0,
      available_inventory: 0,
      overlap_percentage: 0,
    };

    if (!competitors || competitors.length === 0) {
      overlap.available_inventory = allUrls.length;
      overlap.overlap_percentage = 0;
      return overlap;
    }

    const competitorPages = new Set();
    for (const competitor of competitors) {
      for (const page of competitor.sample_pages || []) {
        competitorPages.add(page);
      }
    }

    overlap.competitor_pages = competitorPages.size;

    // NOTE: competitors on a page do NOT automatically remove all inventory.
    // We treat competitor pages as *partially overlapped* inventory, still usable
    // for SmartScroll with careful placement.
    overlap.available_inventory = allUrls.length;
    overlap.overlap_percentage = Math.round((competitorPages.size / allUrls.length) * 100);

    return overlap;
  }

  buildSelector(element) {
    if (!element || !element[0]) return null;
    const id = element.attr('id');
    if (id) return `#${id}`;
    const classes = element.attr('class');
    if (classes) return `.${classes.split(' ')[0]}`;
    return element[0].tagName || 'div';
  }

  getPlacementDetails($, element, contentRoot) {
    const details = {
      location: 'unknown',
      position: 'unknown',
      selector: null,
      context: null
    };
    
    // Determine position relative to content
    const elementIndex = element.index();
    const contentChildren = contentRoot.children();
    const totalChildren = contentChildren.length;
    
    if (elementIndex >= totalChildren * 0.8) {
      details.location = 'bottom';
      details.position = 'near-bottom';
    } else if (elementIndex >= totalChildren * 0.5) {
      details.location = 'middle';
      details.position = 'mid-content';
    } else {
      details.location = 'top';
      details.position = 'near-top';
    }
    
    // Get selector
    details.selector = this.buildSelector(element);
    
    // Get context (parent element)
    const parent = element.parent();
    if (parent.length) {
      details.context = parent.get(0).tagName.toLowerCase();
      if (parent.attr('class')) {
        details.context += `.${parent.attr('class').split(' ')[0]}`;
      }
    }
    
    // Check if it's within article content or sidebar
    const isInArticle = contentRoot.find(element).length > 0;
    const isInSidebar = element.closest('aside, .sidebar, .widget-area').length > 0;
    
    if (isInSidebar) {
      details.location = 'sidebar';
    } else if (isInArticle) {
      details.location = details.location === 'bottom' ? 'end-of-article' : details.location;
    }
    
    return details;
  }
  
  aggregatePlacementDetails(placements) {
    if (!placements || placements.length === 0) {
      return { location: 'unknown', common_locations: [] };
    }
    
    const locationCounts = {};
    placements.forEach(p => {
      if (p && typeof p === 'object' && p.location) {
        locationCounts[p.location] = (locationCounts[p.location] || 0) + 1;
      } else if (typeof p === 'string') {
        locationCounts[p] = (locationCounts[p] || 0) + 1;
      }
    });
    
    const sorted = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]);
    const mostCommon = sorted[0] ? sorted[0][0] : 'unknown';
    
    return {
      location: mostCommon,
      common_locations: sorted.slice(0, 3).map(([loc, count]) => ({ location: loc, count })),
      total_samples: placements.length
    };
  }
  
  getCompetitorCategory(name) {
    const def = COMPETITORS[name];
    return def ? def.category : 'native';
  }
  
  getPlacementDetails($, element, contentRoot) {
    const details = {
      location: 'unknown',
      position: 'unknown',
      selector: null,
      context: null
    };
    
    // Determine position relative to content
    const elementIndex = element.index();
    const contentChildren = contentRoot.children();
    const totalChildren = contentChildren.length;
    
    if (totalChildren > 0) {
      const positionRatio = elementIndex / totalChildren;
      
      if (positionRatio >= 0.8) {
        details.location = 'bottom';
        details.position = 'near-bottom';
      } else if (positionRatio >= 0.5) {
        details.location = 'middle';
        details.position = 'mid-content';
      } else {
        details.location = 'top';
        details.position = 'near-top';
      }
    }
    
    // Get selector
    details.selector = this.buildSelector(element);
    
    // Get context (parent element)
    const parent = element.parent();
    if (parent.length) {
      details.context = parent.get(0).tagName.toLowerCase();
      if (parent.attr('class')) {
        details.context += `.${parent.attr('class').split(' ')[0]}`;
      }
    }
    
    // Check if it's within article content or sidebar
    const isInArticle = contentRoot.find(element).length > 0;
    const isInSidebar = element.closest('aside, .sidebar, .widget-area').length > 0;
    
    if (isInSidebar) {
      details.location = 'sidebar';
    } else if (isInArticle) {
      details.location = details.location === 'bottom' ? 'end-of-article' : details.location;
    }
    
    return details;
  }
  
  aggregatePlacementDetails(placements) {
    if (!placements || placements.length === 0) {
      return { location: 'unknown', common_locations: [] };
    }
    
    const locationCounts = {};
    placements.forEach(p => {
      if (p && typeof p === 'object' && p.location) {
        locationCounts[p.location] = (locationCounts[p.location] || 0) + 1;
      } else if (typeof p === 'string') {
        locationCounts[p] = (locationCounts[p] || 0) + 1;
      }
    });
    
    const sorted = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]);
    const mostCommon = sorted[0] ? sorted[0][0] : 'unknown';
    
    return {
      location: mostCommon,
      common_locations: sorted.slice(0, 3).map(([loc, count]) => ({ location: loc, count })),
      total_samples: placements.length
    };
  }
}

module.exports = CompetitorDetector;
