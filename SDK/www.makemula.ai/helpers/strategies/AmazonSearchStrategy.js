const { BaseSearchStrategy, GenericKeywordGenerator, GenericStrategySuggester } = require('../SearchStrategy');
const { searchAmazonProducts, transformAmazonProduct } = require('../ProductHelpers');
const { createLogger } = require('../LoggingHelpers');
const { resolveCredentials, getCredentialIds } = require('../../config/credentials');
const { OpenAI } = require('openai');

const logger = createLogger('AmazonSearchStrategy');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Amazon search indexes configuration
const AMAZON_SEARCH_INDEXES = {
  All: 'All Departments',
  Apparel: 'Clothing & Accessories',
  Appliances: 'Appliances',
  ArtsAndCrafts: 'Arts, Crafts & Sewing',
  Automotive: 'Automotive Parts & Accessories',
  Baby: 'Baby',
  Beauty: 'Beauty & Personal Care',
  Books: 'Books',
  Collectibles: 'Collectibles & Fine Art',
  Computers: 'Computers',
  Electronics: 'Electronics',
  Fashion: 'Clothing, Shoes & Jewelry',
  FashionBaby: 'Clothing, Shoes & Jewelry Baby',
  FashionBoys: 'Clothing, Shoes & Jewelry Boys',
  FashionGirls: 'Clothing, Shoes & Jewelry Girls',
  FashionMen: 'Clothing, Shoes & Jewelry Men',
  FashionWomen: 'Clothing, Shoes & Jewelry Women',
  GardenAndOutdoor: 'Garden & Outdoor',
  GiftCards: 'Gift Cards',
  GroceryAndGourmetFood: 'Grocery & Gourmet Food',
  Handmade: 'Handmade',
  HealthPersonalCare: 'Health, Household & Baby Care',
  HomeAndKitchen: 'Home & Kitchen',
  Industrial: 'Industrial & Scientific',
  Jewelry: 'Jewelry',
  Luggage: 'Luggage & Travel Gear',
  LuxuryBeauty: 'Luxury Beauty',
  MobileAndAccessories: 'Cell Phones & Accessories',
  MoviesAndTV: 'Movies & TV',
  Music: 'CDs & Vinyl',
  MusicalInstruments: 'Musical Instruments',
  OfficeProducts: 'Office Products',
  PetSupplies: 'Pet Supplies',
  Photo: 'Camera & Photo',
  Shoes: 'Shoes',
  Software: 'Software',
  SportsAndOutdoors: 'Sports & Outdoors',
  ToolsAndHomeImprovement: 'Tools & Home Improvement',
  ToysAndGames: 'Toys & Games',
  VideoGames: 'Video Games',
  Watches: 'Watches'
};

class AmazonSearchStrategy extends BaseSearchStrategy {
  constructor() {
    super();
    this.name = 'amazon';
  }

  /**
   * Generate keywords and select Amazon search index
   */
  async generateKeywords(textContent, hostname, feedback = null, previousKeywords = null) {
    // Use generic keyword generation
    const keywordResult = await GenericKeywordGenerator.generateKeywords(
      textContent, 
      hostname, 
      feedback, 
      previousKeywords
    );

    // Select Amazon search index
    const searchIndex = await this.selectSearchIndex(keywordResult.keywords, feedback);

    return {
      keywords: keywordResult.keywords,
      platformConfig: { 
        searchIndex
      }
    };
  }

  /**
   * Select the best Amazon search index for given keywords
   */
  async selectSearchIndex(keywords, feedback = null) {
    const systemPrompt = "You are an expert at selecting the best Amazon Associates API search index for given keywords. You know which indexes work best for different types of products and search terms. When feedback is provided, carefully consider if it suggests a specific search index and incorporate that suggestion into your decision.";

    const amazonSearchIndexes = Object.entries(AMAZON_SEARCH_INDEXES)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join('\n');

    const userPrompt = `Given the keywords "${keywords}"${feedback ? ` and feedback: "${feedback}"` : ''}, select the best Amazon search index from the list below. 

${amazonSearchIndexes}

Consider:
1. Which index would be most likely to return relevant products for these specific keywords
2. If the feedback suggests a specific search index (e.g., "try FashionGirls index", "use All index"), incorporate that suggestion
3. The relationship between the keywords and the suggested index

Return a JSON object with exactly this property:
- "searchIndex": exact index key from the list above`;

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
      
      if (!data.searchIndex) {
        throw new Error('Invalid response format: missing searchIndex');
      }
      
      const searchIndex = data.searchIndex.trim();
      
      logger.info('Amazon search index selected', { 
        keywords,
        searchIndex,
        hasFeedback: !!feedback
      });

      return searchIndex;
    } catch (error) {
      logger.warn('Failed to select Amazon search index, using fallback', { error: error.message });
      return 'All'; // Fallback to All index
    }
  }

  /**
   * Execute Amazon search
   */
  async executeSearch(keywords, config = {}, credentialId) {
    if (!credentialId) {
      throw new Error('Credential ID is required for Amazon search execution');
    }

    logger.info('Executing Amazon search', { 
      keywords, 
      config,
      searchIndex: config.searchIndex || 'All',
      credentialId
    });

    try {
      // Resolve credentials based on credentialId
      const credentials = resolveCredentials(credentialId, 'amazon');
      
      const amazonConfig = {
        accessKeyId: credentials.accessKeyId,
        secretKey: credentials.secretKey,
        accountId: credentials.accountId,
        searchIndex: config.searchIndex || 'All'
      };
      
      logger.info('Amazon API configuration prepared', {
        keywords,
        searchIndex: amazonConfig.searchIndex,
        accountId: amazonConfig.accountId,
        accessKeyId: amazonConfig.accessKeyId ? '***' + amazonConfig.accessKeyId.slice(-4) : 'undefined'
      });

      const results = await searchAmazonProducts(keywords, amazonConfig);

      const productCount = results.products.length;
      logger.info('Amazon search completed successfully', { 
        keywords, 
        config, 
        productCount,
        searchIndex: amazonConfig.searchIndex
      });

      return {
        products: results.products,
        productCount,
        platform: 'amazon',
        config
      };
    } catch (error) {
      logger.error('Amazon search failed in AmazonSearchStrategy', error, { 
        keywords, 
        config,
        searchIndex: config.searchIndex || 'All',
        errorType: error.constructor.name,
        errorMessage: error.message,
        errorCode: error.code || error.status || error.statusCode,
        amazonConfig: {
          hasAccessKey: !!process.env.MULA_AMAZON_ASSOC_ACCESS_KEY_ID,
          hasSecretKey: !!process.env.MULA_AMAZON_ASSOC_SECRET_KEY,
          hasAccountId: !!process.env.MULA_AMAZON_ASSOC_ACCOUNT_ID,
          accountId: process.env.MULA_AMAZON_ASSOC_ACCOUNT_ID
        }
      });
      throw error;
    }
  }

  /**
   * Assess quality of Amazon search results
   */
  async assessQuality(products, originalKeywords) {
    if (!products || products.length === 0) {
      return 0;
    }

    const systemPrompt = "You are an expert at assessing the quality of Amazon product search results. Rate the relevance and quality of the products found for the given search keywords.";

    const userPrompt = `Assess the quality of these Amazon search results for the keywords "${originalKeywords}":

${products.slice(0, 5).map((product, i) => `${i + 1}. ${product.ItemInfo?.Title?.DisplayValue || 'Unknown'}`).join('\n')}

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
      logger.warn('Failed to assess Amazon search quality, using fallback', { error: error.message });
      // Fallback: simple heuristic based on product count
      return Math.min(products.length / 20, 1);
    }
  }

  /**
   * Suggest next Amazon search strategy
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

  /**
   * Get available search indexes
   */
  static getSearchIndexes() {
    return AMAZON_SEARCH_INDEXES;
  }

  /**
   * Resolve credentials based on credentialId
   * @param {string} credentialId - The credential identifier
   * @returns {Object} Credentials object with accessKeyId, secretKey, accountId
   */
  resolveCredentials(credentialId) {
    return resolveCredentials(credentialId, 'amazon');
  }
}

module.exports = AmazonSearchStrategy; 