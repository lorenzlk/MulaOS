const express = require('express');
const cors = require('cors');
const path = require('path');

// Import Duke modules
const { DukeOnboarding } = require('../duke/src/onboard');

const app = express();
const PORT = process.env.PORT || 3002;

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
  // Set longer timeout for analysis (5 minutes)
  req.setTimeout(300000);
  res.setTimeout(300000);
  
  const { domain, maxUrls, testUrl } = req.body;
  
  if (!domain) {
    return res.status(400).json({ error: 'Domain is required' });
  }
  
  // Sanitize domain - extract just the domain name (remove protocol, paths, etc.)
  const cleanDomain = domain.trim().toLowerCase()
    .replace(/^https?:\/\//, '')  // Remove protocol
    .split('/')[0]                // Take only domain (before first slash)
    .replace(/^www\./, '')        // Remove www prefix
    .replace(/\/$/, '');          // Remove trailing slash
  
  // Extract specific URL if full URL provided
  let specificUrl = null;
  if (testUrl) {
    specificUrl = testUrl;
  } else if (domain.includes('/') && domain.includes('http')) {
    // User provided full URL - extract it
    const urlMatch = domain.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      specificUrl = urlMatch[0];
    }
  }
  
  console.log(`\n🏄‍♂️ Duke analyzing: ${cleanDomain}`);
  if (specificUrl) {
    console.log(`  📍 Testing specific URL: ${specificUrl}`);
  }
  
  try {
    const cacheKey = `duke:analysis:${cleanDomain}`;
    
    const analysisFunc = async () => {
      try {
        // Run Duke onboarding analysis
        console.log(`  Running Duke onboarding analysis...`);
        const duke = new DukeOnboarding();
        const result = await duke.analyze(cleanDomain, { 
          maxUrls: maxUrls || 15000,
          testUrl: specificUrl  // Pass specific URL to test
        });
        
        console.log(`  ✅ Duke analysis complete`);
        return result;
      } catch (innerError) {
        console.error('❌ Inner analysis error:', innerError);
        console.error('Stack trace:', innerError.stack);
        throw innerError;
      }
    };
    
    const result = await getOrExecute(cacheKey, analysisFunc);
    
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

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '1.0.0',
    cache_size: cache.size,
    agent: 'Duke - Onboarding & Placement Intelligence'
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏄‍♂️ Duke Web App`);
  console.log(`${'='.repeat(60)}`);
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api/analyze`);
  console.log(`\nReady to analyze onboarding & placement intelligence!\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

