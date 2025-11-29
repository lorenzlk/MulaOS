const { BaseSearchStrategy, GenericKeywordGenerator, GenericStrategySuggester } = require('../SearchStrategy');
const { searchFanaticsProducts, transformFanaticsProduct } = require('../ProductHelpers');
const { createLogger } = require('../LoggingHelpers');
const { OpenAI } = require('openai');

const logger = createLogger('FanaticsSearchStrategy');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class FanaticsSearchStrategy extends BaseSearchStrategy {
  constructor() {
    super();
    this.name = 'fanatics';
  }

  /**
   * Generate keywords for Fanatics search
   */
  async generateKeywords(textContent, hostname, feedback = null, previousKeywords = null) {
    // Use generic keyword generation
    const keywordResult = await GenericKeywordGenerator.generateKeywords(
      textContent, 
      hostname, 
      feedback, 
      previousKeywords
    );

    return {
      keywords: keywordResult.keywords,
      platformConfig: {}
    };
  }

  /**
   * Execute Fanatics search
   */
  async executeSearch(keywords, config = {}, credentialId) {
    if (!credentialId) {
      throw new Error('Credential ID is required for Fanatics search execution');
    }

    logger.info('Executing Fanatics search', { keywords, config, credentialId });

    try {
      const results = await searchFanaticsProducts(keywords, {
        pageSize: 100,
        maxPages: 1
      });

      const productCount = results.products.length;
      logger.info('Fanatics search results', { keywords, config, productCount });

      return {
        products: results.products,
        productCount,
        platform: 'fanatics',
        config
      };
    } catch (error) {
      logger.error('Fanatics search failed', error, { keywords, config });
      throw error;
    }
  }

  /**
   * Assess quality of Fanatics search results
   */
  async assessQuality(products, originalKeywords) {
    if (!products || products.length === 0) {
      return 0;
    }

    const systemPrompt = "You are an expert at assessing the quality of Fanatics sports merchandise search results. Rate the relevance and quality of the products found for the given search keywords.";

    const userPrompt = `Assess the quality of these Fanatics search results for the keywords "${originalKeywords}":

${products.slice(0, 5).map((product, i) => `${i + 1}. ${product.Name || 'Unknown'}`).join('\n')}

Consider:
1. Relevance to the search keywords
2. Product variety and quality
3. Price range appropriateness
4. Overall usefulness for sports fans
5. Brand authenticity and merchandise quality

Return a JSON object with:
- "qualityScore": a number between 0 and 1 (1 being perfect)
- "reasoning": brief explanation of your assessment`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });

      const data = JSON.parse(response.choices[0].message.content);
      return data.qualityScore || 0.5;
    } catch (error) {
      logger.warn('Failed to assess Fanatics quality, using fallback', { error: error.message });
      // Fallback: simple heuristic based on product count
      return Math.min(products.length / 20, 1);
    }
  }

  /**
   * Suggest next Fanatics search strategy
   */
  async suggestNextStrategy(keywords, config, productCount, baseKeywords, attemptedSearches = []) {
    return GenericStrategySuggester.suggestNextStrategy(
      keywords, 
      config, 
      productCount, 
      baseKeywords, 
      attemptedSearches
    );
  }
}

module.exports = FanaticsSearchStrategy; 