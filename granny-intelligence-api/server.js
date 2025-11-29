const express = require('express');
const cors = require('cors');
const GrannyIntelligence = require('./src/GrannyIntelligence');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Granny Intelligence Engine
const granny = new GrannyIntelligence();

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'granny-intelligence-api',
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Main intelligence endpoint
app.post('/api/intelligence', async (req, res) => {
  try {
    const { domain, url, targetingRule } = req.body;
    
    // Validate input
    if (!domain) {
      return res.status(400).json({ 
        error: 'Missing required field: domain' 
      });
    }
    
    console.log(`\n🏄‍♂️ Granny Intelligence Request:`);
    console.log(`   Domain: ${domain}`);
    console.log(`   URL: ${url || '(not provided)'}`);
    console.log(`   Credentials: ${JSON.stringify(targetingRule?.credentials || {})}`);
    
    // Generate intelligence
    const intelligence = await granny.analyze({
      domain,
      url,
      targetingRule: targetingRule || {}
    });
    
    console.log(`   ✅ Intelligence generated`);
    console.log(`   Context: ${intelligence.context?.event || 'Generic'}`);
    console.log(`   Confidence: ${intelligence.intelligence_metadata?.confidence_level || 'N/A'}`);
    
    res.json(intelligence);
    
  } catch (error) {
    console.error('❌ Intelligence generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate intelligence',
      message: error.message 
    });
  }
});

// Batch intelligence endpoint (for multiple URLs)
app.post('/api/intelligence/batch', async (req, res) => {
  try {
    const { requests } = req.body;
    
    if (!Array.isArray(requests)) {
      return res.status(400).json({ 
        error: 'Expected "requests" array' 
      });
    }
    
    console.log(`\n🏄‍♂️ Granny Batch Intelligence Request: ${requests.length} URLs`);
    
    const results = await Promise.all(
      requests.map(r => granny.analyze(r))
    );
    
    console.log(`   ✅ Generated intelligence for ${results.length} URLs`);
    
    res.json({ results });
    
  } catch (error) {
    console.error('❌ Batch intelligence error:', error);
    res.status(500).json({ 
      error: 'Failed to generate batch intelligence',
      message: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏄‍♂️  GRANNY INTELLIGENCE API`);
  console.log(`${'='.repeat(60)}`);
  console.log(`   Status: Running`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Endpoints:`);
  console.log(`     GET  /health`);
  console.log(`     POST /api/intelligence`);
  console.log(`     POST /api/intelligence/batch`);
  console.log(`${'='.repeat(60)}\n`);
});

module.exports = app;

