const { OpenAI } = require('openai');
const config = require('../config');
const { createLogger } = require('./LoggingHelpers');
const { withRetry } = require('./ProductHelpers');
const { uploadJsonToS3 } = require('./S3Helpers');

const logger = createLogger('KeywordHelpers');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration for keyword generation
const KEYWORD_CONFIG = {
  MAX_WORDS: 5  // Maximum number of words allowed in generated keywords
};

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

// Convert to string format for prompts
const getAmazonSearchIndexesString = () => {
  return Object.entries(AMAZON_SEARCH_INDEXES)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');
};

/**
 * Generate keywords and search index for an article
 * @param {string} textContent - The text content of the article
 * @param {string} hostname - The hostname of the article
 * @param {string} [feedback] - Optional feedback from previous keyword rejection
 * @param {string} [previousKeywords] - Optional previous keywords that were rejected
 * @returns {Object} Object containing keywords and searchIndex
 */
const generateKeywords = async (textContent, hostname, feedback = null, previousKeywords = null) => {
  logger.info('Generating keywords and search index', { 
    hostname, 
    hasFeedback: !!feedback,
    hasPreviousKeywords: !!previousKeywords 
  });

  try {
    // Step 1: Generate keywords first
    const keywordSystemPrompt = feedback ? 
      "You are an online shopping assistant optimized for Amazon Associates API. You specialize in providing shopping keywords for people reading a given internet article. Your reply should match the likely shopping intent of the article's reader, not the literal content of the article. Always generalize brand names unless the brand is essential to the search (e.g. Apple, Nike). Favor broader, brandless product categories. For sports or music articles, prefer merchandise-related terms like 'merch', 'gear', or 'apparel' over context-specific products or memorabilia. Your output should reflect the inferred interests and shopping behavior of the reader. CRITICAL: When feedback is provided, if it contains specific keyword requests, you MUST use those exact keywords. Do not override specific feedback with your own keyword generation." :
      "You are an online shopping assistant optimized for Amazon Associates API. You specialize in providing shopping keywords for people reading a given internet article. Your reply should match the likely shopping intent of the article's reader, not the literal content of the article. Always generalize brand names unless the brand is essential to the search (e.g. Apple, Nike). Favor broader, brandless product categories. For sports or music articles, prefer merchandise-related terms like 'merch', 'gear', or 'apparel' over context-specific products or memorabilia. Your output should reflect the inferred interests and shopping behavior of the reader.";

    const keywordUserPrompt = feedback ?
      `Previous keywords were "${previousKeywords}" and were rejected with this feedback: "${feedback}". Please generate new keywords for the article below on ${hostname}. 

CRITICAL INSTRUCTION: If the feedback contains specific keyword requests (e.g., "use 'dollcore'", "try 'gothic fashion'", "JUST use 'vintage'", "use dollcore", "try gothic fashion"), you MUST use those exact keywords. Look for patterns like:
- "use [keyword]"
- "try [keyword]" 
- "JUST use [keyword]"
- "[keyword] only"
- "use the keyword [keyword]"

When specific keywords are requested in feedback, use them exactly as provided. Do not generate your own keywords when specific ones are requested. The feedback takes absolute priority over all other guidelines.

If no specific keywords are requested in the feedback, then follow the normal guidelines below.

Do not recommend search phrases related to print or physical media like dvds, books, newspapers or magazines. Do not put any quotes in your reply. Do not end your reply with any punctuation. Limit your reply to ${KEYWORD_CONFIG.MAX_WORDS} words. Your reply must be ${KEYWORD_CONFIG.MAX_WORDS} words or less with no new lines. Generalize or omit brand names unless essential. For music and sports content, default to merch or fan gear unless there is a strong product focus.

Return a JSON object with exactly this property:
- "keywords": your ${KEYWORD_CONFIG.MAX_WORDS}-word-or-less search phrase

-----

${textContent}` :
      `Give me Amazon Associates API shopping search keywords for a reader of the article below on ${hostname}. 

Do not recommend search phrases related to print or physical media like dvds, books, newspapers or magazines. Do not put any quotes in your reply. Do not end your reply with any punctuation. Limit your reply to ${KEYWORD_CONFIG.MAX_WORDS} words. Your reply must be ${KEYWORD_CONFIG.MAX_WORDS} words or less with no new lines. Generalize or omit brand names unless essential. For music and sports content, default to merch or fan gear unless there is a strong product focus.

Return a JSON object with exactly this property:
- "keywords": your ${KEYWORD_CONFIG.MAX_WORDS}-word-or-less search phrase

-----

${textContent}`;

    const keywordsResponse = await withRetry(
      () => openai.chat.completions.create({
        model: config.openai.model,
        response_format: {
          type: "json_object"
        },
        messages: [
          {
            "role": "system",
            "content": keywordSystemPrompt
          },
          {
            "role": "user",
            "content": keywordUserPrompt
          }
        ]
      }),
      'generate-keywords'
    );

    const keywordsData = JSON.parse(keywordsResponse.choices[0].message.content);
    
    if (!keywordsData.keywords) {
      throw new Error('Invalid response format: missing keywords');
    }
    
    const keywords = keywordsData.keywords.trim();
    
    // Step 2: Select the best search index based on the keywords and feedback
    const indexSystemPrompt = "You are an expert at selecting the best Amazon Associates API search index for given keywords. You know which indexes work best for different types of products and search terms. When feedback is provided, carefully consider if it suggests a specific search index and incorporate that suggestion into your decision.";

    const amazonSearchIndexes = getAmazonSearchIndexesString();

    const indexUserPrompt = `Given the keywords "${keywords}"${feedback ? ` and feedback: "${feedback}"` : ''}, select the best Amazon search index from the list below. 

${amazonSearchIndexes}

Consider:
1. Which index would be most likely to return relevant products for these specific keywords
2. If the feedback suggests a specific search index (e.g., "try FashionGirls index", "use All index"), incorporate that suggestion
3. The relationship between the keywords and the suggested index

Return a JSON object with exactly this property:
- "searchIndex": exact index key from the list above`;

    const indexResponse = await withRetry(
      () => openai.chat.completions.create({
        model: config.openai.model,
        response_format: {
          type: "json_object"
        },
        messages: [
          {
            "role": "system",
            "content": indexSystemPrompt
          },
          {
            "role": "user",
            "content": indexUserPrompt
          }
        ]
      }),
      'select-search-index'
    );

    const indexData = JSON.parse(indexResponse.choices[0].message.content);
    
    if (!indexData.searchIndex) {
      throw new Error('Invalid response format: missing searchIndex');
    }
    
    const searchIndex = indexData.searchIndex.trim();
    
    logger.info('Keywords and search index generated', { 
      hostname,
      keywords,
      searchIndex,
      hasFeedback: !!feedback,
      hasPreviousKeywords: !!previousKeywords
    });

    return { keywords, searchIndex };
  } catch (error) {
    logger.error('Error generating keywords', error, { hostname });
    throw error;
  }
};

module.exports = {
  generateKeywords,
  AMAZON_SEARCH_INDEXES,
  getAmazonSearchIndexesString,
  KEYWORD_CONFIG
}; 