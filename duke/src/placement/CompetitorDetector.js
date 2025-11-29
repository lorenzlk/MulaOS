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

          if (competitor.selector) {
            competitorCounts[competitor.name].selectors.push(competitor.selector);
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

      return {
        name,
        category: data.category || this.getCompetitorCategory(name),
        detected: true,
        page_count: data.count,
        sample_pages: data.pages.slice(0, 3),
        placement,
        sample_selectors: Array.from(new Set(data.selectors)).slice(0, 3),
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

        competitors.push({
          name,
          category: def.category,
          detected: true,
          placement,
          selector,
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

  getCompetitorCategory(name) {
    const def = COMPETITORS[name];
    return def ? def.category : 'native';
  }
}

module.exports = CompetitorDetector;
