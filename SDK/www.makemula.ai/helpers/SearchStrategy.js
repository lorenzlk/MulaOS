const { createLogger } = require('./LoggingHelpers');
const { OpenAI } = require('openai');

const logger = createLogger('SearchStrategy');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration for keyword generation
const KEYWORD_CONFIG = {
  MAX_WORDS: 5  // Maximum number of words allowed in generated keywords
};

/**
 * Base class for search strategies
 */
class BaseSearchStrategy {
  constructor() {
    this.name = 'base';
  }

  /**
   * Generate keywords for a given article
   * @param {string} textContent - Article content
   * @param {string} hostname - Article hostname
   * @param {string} feedback - Optional feedback
   * @param {string} previousKeywords - Optional previous keywords
   * @returns {Promise<Object>} Keywords and metadata
   */
  async generateKeywords(textContent, hostname, feedback = null, previousKeywords = null) {
    throw new Error('generateKeywords must be implemented by subclass');
  }

  /**
   * Execute a search with given parameters
   * @param {string} keywords - Search keywords
   * @param {Object} config - Platform-specific configuration
   * @returns {Promise<Object>} Search results
   */
  async executeSearch(keywords, config = {}) {
    throw new Error('executeSearch must be implemented by subclass');
  }

  /**
   * Assess the quality of search results
   * @param {Array} products - Search results
   * @param {string} originalKeywords - Original search keywords
   * @returns {Promise<number>} Quality score (0-1)
   */
  async assessQuality(products, originalKeywords) {
    throw new Error('assessQuality must be implemented by subclass');
  }

  /**
   * Suggest next search strategy based on current results
   * @param {string} keywords - Current keywords
   * @param {Object} config - Current platform config
   * @param {number} productCount - Number of products found
   * @param {string} baseKeywords - Original keywords
   * @param {Array} attemptedSearches - Previously attempted searches
   * @returns {Promise<Object>} Next strategy suggestion
   */
  async suggestNextStrategy(keywords, config, productCount, baseKeywords, attemptedSearches = []) {
    throw new Error('suggestNextStrategy must be implemented by subclass');
  }
}

/**
 * Generic keyword generation that works across platforms
 */
class GenericKeywordGenerator {
  static async generateKeywords(textContent, hostname, feedback = null, previousKeywords = null) {
    logger.info('Generating keywords', { 
      hostname, 
      hasFeedback: !!feedback,
      hasPreviousKeywords: !!previousKeywords 
    });

    const systemPrompt = feedback ? 
      "You are an online shopping assistant optimized for product search APIs. You specialize in providing shopping keywords for people reading a given internet article. Your reply should match the likely shopping intent of the article's reader, not the literal content of the article. Always generalize brand names unless the brand is essential to the search (e.g. Apple, Nike). Favor broader, brandless product categories. For sports or music articles, prefer merchandise-related terms like 'merch', 'gear', or 'apparel' over context-specific products or memorabilia. Your output should reflect the inferred interests and shopping behavior of the reader. Consider the provided feedback when generating new keywords." :
      "You are an online shopping assistant optimized for product search APIs. You specialize in providing shopping keywords for people reading a given internet article. Your reply should match the likely shopping intent of the article's reader, not the literal content of the article. Always generalize brand names unless the brand is essential to the search (e.g. Apple, Nike). Favor broader, brandless product categories. For sports or music articles, prefer merchandise-related terms like 'merch', 'gear', or 'apparel' over context-specific products or memorabilia. Your output should reflect the inferred interests and shopping behavior of the reader.";

    const userPrompt = `Give me shopping search keywords for a reader of the article below on ${hostname}. 

Do not recommend search phrases related to print or physical media like dvds, books, newspapers or magazines. Do not put any quotes in your reply. Do not end your reply with any punctuation. Limit your reply to ${KEYWORD_CONFIG.MAX_WORDS} words. Your reply must be ${KEYWORD_CONFIG.MAX_WORDS} words or less with no new lines. Generalize or omit brand names unless essential. For music and sports content, default to merch or fan gear unless there is a strong product focus.

${feedback ? `Previous feedback: "${feedback}"` : ''}
${previousKeywords ? `Previous keywords: "${previousKeywords}"` : ''}

Return a JSON object with exactly this property:
- "keywords": your ${KEYWORD_CONFIG.MAX_WORDS}-word-or-less search phrase

-----

${textContent}`;

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
      
      if (!data.keywords) {
        throw new Error('Invalid response format: missing keywords');
      }
      
      const keywords = data.keywords.trim();
      
      logger.info('Keywords generated', { 
        hostname,
        keywords,
        hasFeedback: !!feedback,
        hasPreviousKeywords: !!previousKeywords
      });

      return { keywords };
    } catch (error) {
      logger.error('Error generating keywords', error, { hostname });
      throw error;
    }
  }
}

/**
 * Generic strategy suggestion that works across platforms
 */
class GenericStrategySuggester {
  static async suggestNextStrategy(keywords, config, productCount, baseKeywords, attemptedSearches = []) {
    const systemPrompt = `You are an expert at optimizing product searches across multiple platforms. Your goal is to find at least 20 products, with 40+ being ideal. You need to suggest whether to try different keywords or different platform configuration based on the current results. Never suggest a keyword+config combination that has already been tried.`;

    const userPrompt = `Current search results:
- Keywords: "${keywords}"
- Platform Config: ${JSON.stringify(config)}
- Products Found: ${productCount}
- Original Keywords: "${baseKeywords}"

Already attempted searches:
${attemptedSearches.map(search => `- ${search.phrase} (${search.platform}): ${search.productCount} products`).join('\n')}

Target: At least 20 products (40+ is ideal)

Based on these results, suggest the next search strategy. Consider:
1. If we got 0 results, we need to try broader keywords or different config
2. If we got some results but not enough, we might need a broader approach or simpler keywords
3. If we've tried many combinations without success, suggest synonyms or related terms
4. Never suggest a combination that's already been attempted
5. The relationship between keywords and platform configuration

For keyword suggestions, consider synonyms and related terms. For example:
- "dollcore" → "doll", "kawaii", "cute", "aesthetic", "pastel"
- "gaming" → "video games", "console", "controller"
- "fitness" → "workout", "exercise", "gym"

Return a JSON object with:
- "action": "change_keywords" or "change_config" or "stop_searching"
- "reason": brief explanation of your strategy
- "newKeywords": if changing keywords, suggest simpler/broader keywords or synonyms (max ${KEYWORD_CONFIG.MAX_WORDS} words)
- "newConfig": if changing config, suggest different platform configuration

If productCount >= 20, set action to "stop_searching". If we've tried many combinations without success, consider stopping.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });

      const strategy = JSON.parse(response.choices[0].message.content);
      logger.info('LLM suggested search strategy', { 
        currentKeywords: keywords,
        currentConfig: config,
        productCount,
        attemptedSearchesCount: attemptedSearches.length,
        strategy 
      });

      return strategy;
    } catch (error) {
      logger.warn('Failed to get LLM search strategy, using fallback', { error: error.message });
      // Fallback strategy
      if (productCount >= 20) {
        return { action: 'stop_searching', reason: 'Target reached' };
      } else if (attemptedSearches.length >= 8) {
        return { action: 'stop_searching', reason: 'Too many attempts, accepting best results' };
      } else if (productCount === 0) {
        return { action: 'change_keywords', reason: 'No results, try broader keywords', newKeywords: baseKeywords.split(' ')[0] };
      } else {
        return { action: 'change_keywords', reason: 'Some results, try synonyms', newKeywords: 'product' };
      }
    }
  }
}

module.exports = {
  BaseSearchStrategy,
  GenericKeywordGenerator,
  GenericStrategySuggester,
  KEYWORD_CONFIG
}; 