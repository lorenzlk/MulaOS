class TargetingRuleGenerator {
  generate(patterns) {
    console.log(`  🎯 Generating targeting rules...`);
    
    const rules = [];
    
    for (const [sport, pattern] of Object.entries(patterns)) {
      const rule = {
        sport: sport,
        path: pattern.pattern,
        search_phrase: this.generateSearchPhrase(sport),
        confidence: pattern.confidence,
        url_count: pattern.url_count,
        status: this.determineStatus(pattern.confidence),
        sample_urls: pattern.sample_urls.slice(0, 3),
        variations: pattern.variations
      };
      
      rules.push(rule);
    }
    
    // Sort by confidence (highest first)
    rules.sort((a, b) => b.confidence - a.confidence);
    
    console.log(`  ✅ Generated ${rules.length} targeting rules`);
    
    return rules;
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
      'wrestling': 'WWE wrestling merchandise'
    };
    
    return phrases[sport] || `${sport.toUpperCase()} merchandise`;
  }
  
  determineStatus(confidence) {
    if (confidence >= 85) {
      return '✅ HIGH CONFIDENCE - Deploy immediately';
    } else if (confidence >= 70) {
      return '🟡 MEDIUM CONFIDENCE - Test on sample URLs first';
    } else if (confidence >= 50) {
      return '⚠️ LOW CONFIDENCE - Manual review required';
    } else {
      return '❌ VERY LOW CONFIDENCE - Do not use';
    }
  }
  
  generateSlackCommand(rule) {
    // Generate ready-to-use Slack command for site targeting
    return `/mula-site-targeting-add domain path:"${rule.path}" search:"${rule.search_phrase}"`;
  }
  
  generateMulaOSCommand(rule, domain) {
    // Generate command for direct database insertion
    return {
      domain: domain,
      path: rule.path,
      search: rule.search_phrase,
      sport: rule.sport,
      confidence: rule.confidence,
      status: 'ready_to_deploy'
    };
  }
}

module.exports = TargetingRuleGenerator;

