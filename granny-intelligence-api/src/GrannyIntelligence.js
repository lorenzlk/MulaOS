const ContextDetector = require('./ContextDetector');
const StrategyGenerator = require('./StrategyGenerator');

class GrannyIntelligence {
  constructor() {
    this.contextDetector = new ContextDetector();
    this.strategyGenerator = new StrategyGenerator();
  }
  
  async analyze({ domain, url, targetingRule }) {
    const timestamp = new Date().toISOString();
    
    // 1. Detect context
    const context = await this.contextDetector.detect(domain, url);
    
    // 2. Generate affiliate-specific strategies
    const searchStrategies = this.strategyGenerator.generate(context, targetingRule);
    
    // 3. Generate fallback strategies
    const fallbackStrategies = this.strategyGenerator.generateFallback(domain, url);
    
    // 4. Build intelligence metadata
    const metadata = {
      has_context: context !== null,
      context_type: context?.type || null,
      confidence_level: context?.confidence || 'low',
      recommendation: context ? 'Use contextual strategies for maximum lift' : 'Use fallback strategies'
    };
    
    return {
      domain,
      url,
      timestamp,
      context,
      search_strategies: searchStrategies,
      fallback_strategies: fallbackStrategies,
      intelligence_metadata: metadata
    };
  }
}

module.exports = GrannyIntelligence;

