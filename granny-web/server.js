const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

// Import Granny modules
const { GrannyOnboarding } = require('../granny/src/onboard');
const { GrannyContext } = require('../granny/src/context');

const app = express();
const PORT = process.env.PORT || 3000;
const GRANNY_API_URL = process.env.GRANNY_API_URL || 'http://localhost:3001';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Cache to avoid re-analyzing same domain (1 hour TTL)
const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour

// Helper: Get from cache or execute
async function getOrExecute(key, fn) {
  if (cache.has(key)) {
    const cached = cache.get(key);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`📦 Cache hit: ${key}`);
      return cached.data;
    }
    cache.delete(key);
  }
  
  console.log(`🔍 Cache miss: ${key}, executing...`);
  const data = await fn();
  cache.set(key, { data, timestamp: Date.now() });
  
  // Auto-cleanup after TTL
  setTimeout(() => cache.delete(key), CACHE_TTL);
  
  return data;
}

// API: Analyze domain
app.post('/api/analyze', async (req, res) => {
  const { domain, manualPatterns } = req.body;
  
  if (!domain) {
    return res.status(400).json({ error: 'Domain is required' });
  }
  
  // Sanitize domain
  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  console.log(`\n🏄‍♂️ Analyzing: ${cleanDomain}`);
  if (manualPatterns && manualPatterns.length > 0) {
    console.log(`   📝 Using ${manualPatterns.length} manual patterns`);
  }
  
  try {
    // Don't cache if manual patterns provided (always fresh analysis)
    const cacheKey = manualPatterns && manualPatterns.length > 0 ? null : `analysis:${cleanDomain}`;
    
    const analysisFunc = async () => {
      try {
        // Run onboarding analysis
        console.log(`  Running onboarding analysis...`);
        const onboarding = new GrannyOnboarding();
        const onboardResult = await onboarding.analyze(cleanDomain, { maxUrls: 10000 });
        
        // Run context analysis
        console.log(`  Running context analysis...`);
        const context = new GrannyContext();
        const contextResult = await context.analyze(cleanDomain);
        
        // Get contextual intelligence from Granny Intelligence API
        console.log(`  📡 Calling Granny Intelligence API for contextual intelligence...`);
        let contextualIntelligence = contextResult.contextual_intelligence;
        let searchStrategies = contextResult.search_strategies;
        
        try {
          const intelligenceResponse = await axios.post(`${GRANNY_API_URL}/api/intelligence`, {
            domain: cleanDomain,
            url: '/',
            targetingRule: {
              search: 'sports merchandise',
              credentials: {
                impact: 'example',
                amazon: null
              }
            }
          }, { timeout: 5000 });
          
          const intelligence = intelligenceResponse.data;
          
          if (intelligence.context) {
            contextualIntelligence = intelligence.context;
            searchStrategies = intelligence.search_strategies;
            console.log(`  ✅ Granny API context: ${intelligence.context.event}`);
          }
        } catch (apiError) {
          console.log(`  ℹ️  Granny API unavailable, using local context`);
        }
        
        // Merge manual patterns with discovered patterns
        let allPatterns = onboardResult.url_patterns || [];
        
        if (manualPatterns && manualPatterns.length > 0) {
          console.log(`  Processing ${manualPatterns.length} manual patterns...`);
          
          // Add manual patterns with smart sport detection
          const manualFormatted = manualPatterns.map((mp, index) => {
            try {
              console.log(`    Pattern ${index + 1}: ${mp.pattern}`);
              
              // If no sport provided, try to detect from pattern
              let detectedSport = mp.sport;
              if (!detectedSport || (typeof detectedSport === 'string' && detectedSport.trim() === '')) {
                console.log(`      Detecting sport from pattern...`);
                detectedSport = detectSportFromPattern(mp.pattern);
                console.log(`      Detected: ${detectedSport}`);
              }
              
              // Generate search phrase with context
              let searchPhrase = mp.search_phrase;
              if (!searchPhrase || (typeof searchPhrase === 'string' && searchPhrase.trim() === '')) {
                console.log(`      Generating search phrase...`);
                searchPhrase = generateSmartSearchPhrase(mp.pattern, detectedSport);
                console.log(`      Generated: ${searchPhrase}`);
              }
              
              return {
                sport: detectedSport,
                pattern: mp.pattern,
                confidence: 100, // Manual patterns are 100% confidence
                url_count: 0, // No URL analysis
                sample_urls: [],
                search_phrase: searchPhrase,
                manual: true
              };
            } catch (patternError) {
              console.error(`    Error processing pattern ${index + 1}:`, patternError);
              // Return a safe default
              return {
                sport: 'custom',
                pattern: mp.pattern,
                confidence: 100,
                url_count: 0,
                sample_urls: [],
                search_phrase: 'Sports merchandise',
                manual: true
              };
            }
          });
          
          allPatterns = [...manualFormatted, ...allPatterns];
        }
      
        // Generate Slack commands
        console.log(`  Generating Slack commands...`);
        const slackCommands = generateSlackCommands(cleanDomain, allPatterns);
        
        // Combine results
        return {
          domain: cleanDomain,
          analyzed_at: new Date().toISOString(),
          health_check: onboardResult.health_check || {},
          traffic_estimate: onboardResult.traffic_estimate || {},
          url_patterns: allPatterns,
          business_intelligence: contextResult.business_intelligence || {},
          contextual_intelligence: contextualIntelligence || contextResult.contextual_intelligence || {},
          search_strategies: searchStrategies || contextResult.search_strategies || null,
          competitive_intelligence: contextResult.competitive_intelligence || {},
          monetization_maturity: contextResult.monetization_maturity || {},
          deployment_readiness: onboardResult.deployment_readiness || {},
          recommendations: onboardResult.recommendations || [],
          deployment_ready: onboardResult.deployment_ready || false,
          slack_commands: slackCommands,
          has_manual_patterns: manualPatterns && manualPatterns.length > 0
        };
      } catch (innerError) {
        console.error('❌ Inner analysis error:', innerError);
        console.error('Stack trace:', innerError.stack);
        throw innerError;
      }
    };
    
    const result = cacheKey 
      ? await getOrExecute(cacheKey, analysisFunc)
      : await analysisFunc();
    
    console.log(`  ✅ Analysis complete`);
    res.json(result);
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'Analysis failed',
      details: error.stack,
      domain: cleanDomain
    });
  }
});

// Helper: Generate Slack commands from patterns
function generateSlackCommands(domain, patterns) {
  // Ensure patterns is an array
  const patternArray = Array.isArray(patterns) ? patterns : Object.values(patterns || {});
  
  if (!patternArray || patternArray.length === 0) {
    return '# No targeting patterns discovered\n# Manual URL inspection recommended';
  }
  
  const commands = patternArray
    .filter(p => p && (p.confidence >= 50 || p.manual)) // Include manual patterns and 50%+ confidence
    .map(p => {
      const label = p.manual ? '# [MANUAL]' : '';
      return `${label} /mula-site-targeting-add ${domain} path:"${p.pattern}" search:"${p.search_phrase}"`;
    })
    .join('\n');
  
  if (!commands) {
    return '# No high-confidence patterns found\n# Consider manual URL analysis';
  }
  
  return commands;
}

// Helper: Detect sport from URL pattern
function detectSportFromPattern(pattern) {
  const lowerPattern = pattern.toLowerCase();
  
  // Team-specific detection (ON3 style)
  const teamPatterns = {
    'ohio-state': 'cfb',
    'buckeyes': 'cfb',
    'michigan': 'cfb',
    'wolverines': 'cfb',
    'alabama': 'cfb',
    'crimson-tide': 'cfb',
    'georgia': 'cfb',
    'bulldogs': 'cfb',
    'lakers': 'nba',
    'warriors': 'nba',
    'celtics': 'nba',
    'yankees': 'mlb',
    'red-sox': 'mlb',
    'cowboys': 'nfl',
    'patriots': 'nfl'
  };
  
  for (const [teamName, sport] of Object.entries(teamPatterns)) {
    if (lowerPattern.includes(teamName)) {
      return sport;
    }
  }
  
  // Sport-specific detection
  if (lowerPattern.includes('nfl')) return 'nfl';
  if (lowerPattern.includes('nba') || lowerPattern.includes('basketball')) return 'nba';
  if (lowerPattern.includes('mlb') || lowerPattern.includes('baseball')) return 'mlb';
  if (lowerPattern.includes('nhl') || lowerPattern.includes('hockey')) return 'nhl';
  if (lowerPattern.includes('cfb') || lowerPattern.includes('college-football')) return 'cfb';
  if (lowerPattern.includes('soccer') || lowerPattern.includes('football') && !lowerPattern.includes('nfl')) return 'soccer';
  if (lowerPattern.includes('tennis')) return 'tennis';
  if (lowerPattern.includes('golf')) return 'golf';
  if (lowerPattern.includes('boxing')) return 'boxing';
  if (lowerPattern.includes('ufc') || lowerPattern.includes('mma')) return 'ufc';
  if (lowerPattern.includes('nascar') || lowerPattern.includes('racing')) return 'nascar';
  if (lowerPattern.includes('wrestling') || lowerPattern.includes('wwe')) return 'wrestling';
  
  return 'custom';
}

// Helper: Generate smart search phrase from pattern and sport
function generateSmartSearchPhrase(pattern, sport) {
  const lowerPattern = pattern.toLowerCase();
  
  // Team-specific phrases (most valuable!)
  if (lowerPattern.includes('ohio-state') || lowerPattern.includes('buckeyes')) {
    return 'Ohio State Buckeyes merchandise';
  }
  if (lowerPattern.includes('michigan') || lowerPattern.includes('wolverines')) {
    return 'Michigan Wolverines merchandise';
  }
  if (lowerPattern.includes('alabama') || lowerPattern.includes('crimson-tide')) {
    return 'Alabama Crimson Tide merchandise';
  }
  if (lowerPattern.includes('lakers')) {
    return 'Los Angeles Lakers merchandise';
  }
  if (lowerPattern.includes('warriors')) {
    return 'Golden State Warriors merchandise';
  }
  
  // Sport-specific phrases
  const sportPhrases = {
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
    'custom': 'Sports merchandise'
  };
  
  return sportPhrases[sport] || `${sport.toUpperCase()} merchandise`;
}

// Helper: Generate search phrase for sport (backwards compatibility)
function generateSearchPhraseForSport(sport) {
  return generateSmartSearchPhrase('', sport);
}

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '1.0.0',
    cache_size: cache.size
  });
});

// API: Clear cache (for testing)
app.post('/api/cache/clear', (req, res) => {
  const size = cache.size;
  cache.clear();
  res.json({ message: `Cleared ${size} cached entries` });
});

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏄‍♂️ Granny Web App`);
  console.log(`${'='.repeat(60)}`);
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api/analyze`);
  console.log(`\nReady to analyze publishers!\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

