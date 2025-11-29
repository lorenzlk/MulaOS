const sportsConfig = require('./config/sports.json');
const teamsConfig = require('./config/teams.json');

class ContextDetector {
  constructor() {
    this.sportsConfig = sportsConfig;
    this.teamsConfig = teamsConfig;
  }
  
  async detect(domain, url) {
    // Detect publisher type
    const publisherContext = this.detectPublisher(domain);
    if (!publisherContext) {
      return null; // Unknown publisher, no context
    }
    
    // Detect sport from URL
    const sport = this.detectSport(url, publisherContext);
    if (!sport) {
      return null; // Can't determine sport
    }
    
    // Detect team from URL
    const team = this.detectTeam(url, publisherContext);
    
    // Detect current sports context (rivalry, championship, etc.)
    const currentContext = this.detectCurrentContext(sport, team);
    
    if (!currentContext) {
      return null; // No special context
    }
    
    return currentContext;
  }
  
  detectPublisher(domain) {
    const cleanDomain = domain.toLowerCase().replace(/^www\./, '');
    
    const publishers = {
      'on3.com': {
        type: 'sports_focused',
        primary_sports: ['cfb', 'college-basketball', 'recruiting'],
        teams: [
          { name: 'Ohio State', slug: 'ohio-state-buckeyes', sport: 'cfb', rivals: ['Michigan', 'Penn State'] },
          { name: 'Alabama', slug: 'alabama-crimson-tide', sport: 'cfb', rivals: ['Auburn', 'LSU'] },
          { name: 'Michigan', slug: 'michigan-wolverines', sport: 'cfb', rivals: ['Ohio State', 'Michigan State'] },
          { name: 'Georgia', slug: 'georgia-bulldogs', sport: 'cfb', rivals: ['Florida', 'Auburn'] }
        ]
      },
      'essentiallysports.com': {
        type: 'multi_sport',
        primary_sports: ['nfl', 'nba', 'boxing', 'ufc', 'tennis', 'golf']
      },
      'bleacherreport.com': {
        type: 'multi_sport',
        primary_sports: ['nfl', 'nba', 'mlb', 'nhl', 'soccer']
      }
    };
    
    return publishers[cleanDomain] || null;
  }
  
  detectSport(url, publisherContext) {
    if (!url) return publisherContext.primary_sports[0]; // Default to first sport
    
    const urlLower = url.toLowerCase();
    
    // Sport keywords
    const sportPatterns = {
      'cfb': ['college-football', 'cfb', 'buckeyes', 'wolverines', 'crimson-tide', 'bulldogs', 'teams/'],
      'nfl': ['nfl', 'football/nfl', 'super-bowl'],
      'nba': ['nba', 'basketball/nba'],
      'college-basketball': ['college-basketball', 'cbb', 'march-madness'],
      'mlb': ['mlb', 'baseball'],
      'nhl': ['nhl', 'hockey'],
      'boxing': ['boxing', 'fight'],
      'ufc': ['ufc', 'mma'],
      'tennis': ['tennis'],
      'golf': ['golf']
    };
    
    for (const [sport, patterns] of Object.entries(sportPatterns)) {
      if (patterns.some(p => urlLower.includes(p))) {
        return sport;
      }
    }
    
    return publisherContext.primary_sports[0]; // Default
  }
  
  detectTeam(url, publisherContext) {
    if (!url || !publisherContext.teams) return null;
    
    const urlLower = url.toLowerCase();
    
    for (const team of publisherContext.teams) {
      if (urlLower.includes(team.slug)) {
        return team;
      }
    }
    
    return null;
  }
  
  detectCurrentContext(sport, team) {
    const currentDate = new Date();
    const month = currentDate.getMonth(); // 0-11
    const day = currentDate.getDate();
    
    // College Football context
    if (sport === 'cfb') {
      // Rivalry Week (late November)
      if (month === 10 && day >= 20) {
        return {
          type: 'rivalry-week',
          event: team ? `${team.name} Rivalry Week` : 'College Football Rivalry Week',
          sport: 'cfb',
          team: team?.name || null,
          rival: team?.rivals[0] || null,
          phase: 'rivalry-week',
          urgency: 'high',
          expected_lift: '3-4x CTR',
          duration: '7 days',
          confidence: 'high'
        };
      }
      
      // Conference Championships (early December)
      if (month === 11 && day <= 7) {
        return {
          type: 'conference-championships',
          event: 'Conference Championship Week',
          sport: 'cfb',
          team: team?.name || null,
          phase: 'championship',
          urgency: 'high',
          expected_lift: '2-3x CTR',
          duration: '3 days',
          confidence: 'high'
        };
      }
      
      // Playoff Season (late December / early January)
      if ((month === 11 && day >= 20) || month === 0) {
        return {
          type: 'cfp-playoffs',
          event: 'College Football Playoff',
          sport: 'cfb',
          team: team?.name || null,
          phase: 'playoff',
          urgency: 'critical',
          expected_lift: '4-5x CTR',
          duration: '14 days',
          confidence: 'high'
        };
      }
      
      // Regular season (September - November)
      if (month >= 8 && month <= 10) {
        return {
          type: 'regular-season',
          event: 'CFB Regular Season',
          sport: 'cfb',
          team: team?.name || null,
          phase: 'regular-season',
          urgency: 'medium',
          expected_lift: '1.5-2x CTR',
          duration: 'ongoing',
          confidence: 'medium'
        };
      }
    }
    
    // NFL context
    if (sport === 'nfl') {
      // Super Bowl (early February)
      if (month === 1 && day <= 14) {
        return {
          type: 'super-bowl',
          event: 'Super Bowl Week',
          sport: 'nfl',
          phase: 'championship',
          urgency: 'critical',
          expected_lift: '4-5x CTR',
          duration: '7 days',
          confidence: 'high'
        };
      }
      
      // Playoffs (January)
      if (month === 0) {
        return {
          type: 'nfl-playoffs',
          event: 'NFL Playoffs',
          sport: 'nfl',
          phase: 'playoff',
          urgency: 'high',
          expected_lift: '3-4x CTR',
          duration: '21 days',
          confidence: 'high'
        };
      }
      
      // Regular season (September - December)
      if (month >= 8 && month <= 11) {
        return {
          type: 'regular-season',
          event: 'NFL Regular Season',
          sport: 'nfl',
          phase: 'regular-season',
          urgency: 'medium',
          expected_lift: '1.5-2x CTR',
          duration: 'ongoing',
          confidence: 'medium'
        };
      }
    }
    
    // No special context detected
    return null;
  }
}

module.exports = ContextDetector;

