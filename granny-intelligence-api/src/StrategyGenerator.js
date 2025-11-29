class StrategyGenerator {
  generate(context, targetingRule) {
    if (!context) {
      return this.generateGenericStrategies(targetingRule);
    }
    
    const strategies = {
      impact: this.generateImpactStrategy(context, targetingRule),
      amazon: this.generateAmazonStrategy(context, targetingRule)
    };
    
    return strategies;
  }
  
  generateImpactStrategy(context, targetingRule) {
    const hasCredentials = targetingRule?.credentials?.impact !== null && targetingRule?.credentials?.impact !== undefined;
    
    let primarySearch, secondarySearch, filters, boostKeywords, reasoning;
    
    switch (context.type) {
      case 'rivalry-week':
        primarySearch = `Beat ${context.rival}`;
        secondarySearch = `${context.team} Rivalry`;
        filters = {
          sport: context.sport,
          team: this.normalizeTeamName(context.team),
          tags: ['rivalry', context.rival?.toLowerCase()]
        };
        boostKeywords = ['beat', 'rivalry', 'game day'];
        reasoning = `Rivalry week detected - Fanatics has specific rivalry merchandise for ${context.team} vs ${context.rival}`;
        break;
        
      case 'conference-championships':
      case 'cfp-playoffs':
      case 'super-bowl':
        primarySearch = `${context.team || context.sport.toUpperCase()} Champions`;
        secondarySearch = `${context.team || context.sport.toUpperCase()} Championship`;
        filters = {
          sport: context.sport,
          team: context.team ? this.normalizeTeamName(context.team) : undefined,
          type: 'championship'
        };
        boostKeywords = ['champions', 'championship', 'playoff'];
        reasoning = `Championship season - Premium championship merchandise available`;
        break;
        
      case 'regular-season':
      default:
        primarySearch = context.team || context.sport.toUpperCase();
        secondarySearch = `${context.team || context.sport.toUpperCase()} Merchandise`;
        filters = {
          sport: context.sport,
          team: context.team ? this.normalizeTeamName(context.team) : undefined
        };
        boostKeywords = ['official', 'licensed'];
        reasoning = `Regular season merchandise`;
        break;
    }
    
    return {
      applicable: hasCredentials,
      primary_search: primarySearch,
      secondary_search: secondarySearch,
      filters: filters,
      boost_keywords: boostKeywords,
      confidence: context.confidence === 'high' ? 0.92 : 0.75,
      reasoning: reasoning,
      expected_products: this.estimateProductCount('impact', context.type)
    };
  }
  
  generateAmazonStrategy(context, targetingRule) {
    const hasCredentials = targetingRule?.credentials?.amazon !== null && targetingRule?.credentials?.amazon !== undefined;
    
    let primarySearch, secondarySearch, keywords, categoryHints, reasoning;
    
    const teamNickname = context.team ? this.getTeamNickname(context.team) : '';
    
    switch (context.type) {
      case 'rivalry-week':
        primarySearch = `${context.team} beat ${context.rival} rivalry shirt`;
        secondarySearch = `${context.team} ${context.rival} game day apparel`;
        keywords = [
          context.team?.toLowerCase(),
          `beat ${context.rival?.toLowerCase()}`,
          'rivalry',
          teamNickname,
          'shirt',
          'apparel',
          'fan gear'
        ];
        categoryHints = ['sports fan shop', 'clothing', 'novelty'];
        reasoning = `Rivalry week - Keyword-rich query targeting ${context.team} vs ${context.rival} merchandise`;
        break;
        
      case 'conference-championships':
      case 'cfp-playoffs':
      case 'super-bowl':
        const eventName = context.event.toLowerCase().replace(/\s+/g, ' ');
        primarySearch = `${context.team || context.sport} national champions ${context.sport} championship gear`;
        secondarySearch = `${context.team || context.sport} playoff champions merchandise`;
        keywords = [
          context.team?.toLowerCase() || context.sport,
          'national champions',
          'championship',
          context.sport,
          teamNickname
        ];
        categoryHints = ['sports fan shop', 'championship gear'];
        reasoning = `Championship season - Premium championship merchandise search`;
        break;
        
      case 'regular-season':
      default:
        primarySearch = `${context.team || context.sport} ${teamNickname} merchandise fan gear`;
        secondarySearch = `${context.team || context.sport} apparel`;
        keywords = [
          context.team?.toLowerCase() || context.sport,
          teamNickname,
          'fan',
          'merchandise',
          'apparel'
        ];
        categoryHints = ['sports fan shop'];
        reasoning = `Regular season merchandise search`;
        break;
    }
    
    return {
      applicable: hasCredentials,
      primary_search: primarySearch,
      secondary_search: secondarySearch,
      keywords: keywords.filter(Boolean),
      category_hints: categoryHints,
      confidence: context.confidence === 'high' ? 0.88 : 0.70,
      reasoning: reasoning,
      expected_products: this.estimateProductCount('amazon', context.type)
    };
  }
  
  generateGenericStrategies(targetingRule) {
    const baseSearch = targetingRule?.search || 'sports merchandise';
    
    return {
      impact: {
        applicable: targetingRule?.credentials?.impact !== null,
        primary_search: baseSearch,
        secondary_search: 'Sports Merchandise',
        filters: {},
        boost_keywords: [],
        confidence: 0.5,
        reasoning: 'No context detected, using base targeting rule',
        expected_products: '20-40'
      },
      amazon: {
        applicable: targetingRule?.credentials?.amazon !== null,
        primary_search: baseSearch,
        secondary_search: 'sports fan gear',
        keywords: baseSearch.toLowerCase().split(/\s+/),
        category_hints: ['sports fan shop'],
        confidence: 0.5,
        reasoning: 'No context detected, using base targeting rule',
        expected_products: '30-50'
      }
    };
  }
  
  generateFallback(domain, url) {
    return {
      impact: {
        search: 'Sports Merchandise',
        filters: {}
      },
      amazon: {
        search: 'sports fan gear',
        category: 'sports fan shop'
      }
    };
  }
  
  normalizeTeamName(teamName) {
    if (!teamName) return '';
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
    
    return nicknames[teamName] || teamName?.toLowerCase() || '';
  }
  
  estimateProductCount(affiliate, contextType) {
    const estimates = {
      impact: {
        'rivalry-week': '15-25',
        'conference-championships': '10-20',
        'cfp-playoffs': '12-22',
        'super-bowl': '15-30',
        'regular-season': '20-40',
        'default': '20-40'
      },
      amazon: {
        'rivalry-week': '20-40',
        'conference-championships': '15-30',
        'cfp-playoffs': '18-35',
        'super-bowl': '25-50',
        'regular-season': '30-50',
        'default': '30-50'
      }
    };
    
    return estimates[affiliate][contextType] || estimates[affiliate]['default'];
  }
}

module.exports = StrategyGenerator;

