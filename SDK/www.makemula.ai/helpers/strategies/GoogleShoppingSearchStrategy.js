const { BaseSearchStrategy, GenericKeywordGenerator, GenericStrategySuggester } = require('../SearchStrategy');
const { searchGoogleShoppingProducts } = require('../ProductHelpers');
const { createLogger } = require('../LoggingHelpers');
const { OpenAI } = require('openai');

const logger = createLogger('GoogleShoppingSearchStrategy');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class GoogleShoppingSearchStrategy extends BaseSearchStrategy {
  constructor() {
    super();
    this.name = 'google_shopping';
  }

  /**
   * Generate keywords and select Google Shopping configuration
   */
  async generateKeywords(textContent, hostname, feedback = null, previousKeywords = null) {
    // Use generic keyword generation
    const keywordResult = await GenericKeywordGenerator.generateKeywords(
      textContent, 
      hostname, 
      feedback, 
      previousKeywords
    );

    // Select Google Shopping configuration
    const config = await this.selectConfig(keywordResult.keywords, feedback);

    return {
      keywords: keywordResult.keywords,
      platformConfig: {
        ...config
      }
    };
  }

  /**
   * Select Google Shopping configuration (location, language, etc.)
   */
  async selectConfig(keywords, feedback = null) {
    const systemPrompt = "You are an expert at configuring Google Shopping searches. You know which locations and settings work best for different types of products and search terms.";

    const userPrompt = `Given the keywords "${keywords}"${feedback ? ` and feedback: "${feedback}"` : ''}, select the best Google Shopping configuration.

Available locations: United States, Canada, United Kingdom, Australia, Germany, France, Japan
Available languages: en, es, fr, de, ja, pt

Consider:
1. Which location would be most likely to return relevant products
2. Language preferences for the search
3. If the feedback suggests specific location or language settings

Return a JSON object with:
- "location": location for the search (e.g., "United States")
- "language": language code (e.g., "en")
- "country": country code (e.g., "us")`;

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
      
      const config = {
        location: data.location || 'United States',
        language: data.language || 'en',
        country: data.country || 'us'
      };
      
      logger.info('Google Shopping config selected', { 
        keywords,
        config,
        hasFeedback: !!feedback
      });

      return config;
    } catch (error) {
      logger.warn('Failed to select Google Shopping config, using fallback', { error: error.message });
      return {
        location: 'United States',
        language: 'en',
        country: 'us'
      };
    }
  }

  /**
   * Execute Google Shopping search
   */
  async executeSearch(keywords, config = {}, credentialId) {
    if (!credentialId) {
      throw new Error('Credential ID is required for Google Shopping search execution');
    }

    logger.info('Executing Google Shopping search', { keywords, config, credentialId });

    try {
      const results = await searchGoogleShoppingProducts(keywords, {
        location: config.location || 'United States',
        language: config.language || 'en',
        country: config.country || 'us'
      });

      const productCount = results.products.length;
      logger.info('Google Shopping search results', { keywords, config, productCount });

      return {
        products: results.products,
        productCount,
        platform: 'google_shopping',
        config
      };
    } catch (error) {
      logger.error('Google Shopping search failed', error, { keywords, config });
      throw error;
    }
  }

  /**
   * Assess quality of Google Shopping search results
   */
  async assessQuality(products, originalKeywords) {
    if (!products || products.length === 0) {
      return 0;
    }

    const systemPrompt = "You are an expert at assessing the quality of Google Shopping search results. Rate the relevance and quality of the products found for the given search keywords.";

    const userPrompt = `Assess the quality of these Google Shopping search results for the keywords "${originalKeywords}":

${products.slice(0, 5).map((product, i) => `${i + 1}. ${product.title || 'Unknown'}`).join('\n')}

Consider:
1. Relevance to the search keywords
2. Product variety and quality
3. Price range appropriateness
4. Overall usefulness for the user

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
      logger.warn('Failed to assess Google Shopping quality, using fallback', { error: error.message });
      // Fallback: simple heuristic based on product count
      return Math.min(products.length / 20, 1);
    }
  }

  /**
   * Suggest next Google Shopping search strategy
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

module.exports = GoogleShoppingSearchStrategy; 