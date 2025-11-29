require('dotenv').config();
const { Search, Page } = require('../models');
const { createLogger } = require('../helpers/LoggingHelpers');
const { sendSlackMessage, sendSlackReply } = require('../helpers/SlackHelpers');
const { searchAmazonProducts, searchGoogleShoppingProducts, generateProductDescriptions, transformAmazonProduct } = require('../helpers/ProductHelpers');
const { uploadJsonToS3 } = require('../helpers/S3Helpers');
const { getSearchURLs } = require('../helpers/URLHelpers');
const { AMAZON_SEARCH_INDEXES, KEYWORD_CONFIG } = require('../helpers/KeywordHelpers');
const SearchOrchestrator = require('../helpers/SearchOrchestrator');
const AmazonSearchStrategy = require('../helpers/strategies/AmazonSearchStrategy');

const logger = createLogger('SearchWorker');

/**
 * Ask LLM to suggest next search strategy based on current results
 * @param {string} keywords - Current keywords being used
 * @param {string} searchIndex - Current search index
 * @param {number} productCount - Number of products found
 * @param {string} baseKeywords - Original keywords
 * @param {Set} searchedCombinations - Set of already searched keyword+index combinations
 * @returns {Object} Suggested next search parameters
 */
async function getNextSearchStrategy(keywords, searchIndex, productCount, baseKeywords, searchedCombinations = new Set()) {
  const { OpenAI } = require('openai');
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const systemPrompt = `You are an expert at optimizing Amazon Associates API searches. Your goal is to find at least 20 products, with 40+ being ideal. You need to suggest whether to try different keywords or a different search index based on the current results. Never suggest a keyword+index combination that has already been tried.`;

  const userPrompt = `Current search results:
- Keywords: "${keywords}"
- Search Index: "${searchIndex}"
- Products Found: ${productCount}
- Original Keywords: "${baseKeywords}"

Already searched combinations:
${Array.from(searchedCombinations).map(combo => `- ${combo}`).join('\n')}

Available search indexes:
${Object.entries(AMAZON_SEARCH_INDEXES).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Target: At least 20 products (40+ is ideal)

Based on these results, suggest the next search strategy. Consider:
1. If we got 0 results, we need to try broader keywords or a different index
2. If we got some results but not enough, we might need a broader index or simpler keywords
3. If we've tried many combinations without success, suggest synonyms or related terms
4. Never suggest a combination that's already in the "Already searched combinations" list
5. The relationship between keywords and search index

For keyword suggestions, consider synonyms and related terms. For example:
- "dollcore" → "doll", "kawaii", "cute", "aesthetic", "pastel"
- "gaming" → "video games", "console", "controller"
- "fitness" → "workout", "exercise", "gym"

Return a JSON object with:
- "action": "change_keywords" or "change_index" or "stop_searching"
- "reason": brief explanation of your strategy
- "newKeywords": if changing keywords, suggest simpler/broader keywords or synonyms (max ${KEYWORD_CONFIG.MAX_WORDS} words)
- "newSearchIndex": if changing index, suggest a different index from the list above

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
      currentIndex: searchIndex,
      productCount,
      searchedCombinationsCount: searchedCombinations.size,
      strategy 
    });

    return strategy;
  } catch (error) {
    logger.warn('Failed to get LLM search strategy, using fallback', { error: error.message });
    // Fallback strategy
    if (productCount >= 20) {
      return { action: 'stop_searching', reason: 'Target reached' };
    } else if (searchedCombinations.size >= 8) {
      return { action: 'stop_searching', reason: 'Too many attempts, accepting best results' };
    } else if (productCount === 0) {
      return { action: 'change_index', reason: 'No results, try broader index', newSearchIndex: 'All' };
    } else {
      return { action: 'change_keywords', reason: 'Some results, try synonyms', newKeywords: 'doll' };
    }
  }
}

/**
 * Progressive search strategy to find products
 * @param {string} baseKeywords - The original keywords from the search
 * @param {string} searchIndex - The original search index
 * @returns {Object} Object containing products and the successful search details
 */
async function progressiveSearch(baseKeywords, searchIndex) {
  const targetProducts = 20;
  const goldStarProducts = 40;
  const maxAttempts = 5; // Reduced from 10 to 5 attempts
  
  let currentKeywords = baseKeywords;
  let currentIndex = searchIndex;
  let attempts = 0;
  let bestResults = { products: [], productCount: 0 };
  
  // Track all search combinations to avoid duplicates
  const searchedCombinations = new Set();
  
  logger.info('Starting LLM-guided progressive search', { 
    baseKeywords, 
    originalIndex: searchIndex,
    targetProducts,
    maxAttempts
  });

  while (attempts < maxAttempts) {
    attempts++;
    
    // Create search combination key
    const searchKey = `${currentKeywords}|${currentIndex}`;
    
    // Skip if we've already tried this combination
    if (searchedCombinations.has(searchKey)) {
      logger.info('Skipping duplicate search combination', { 
        attempt: attempts,
        keywords: currentKeywords, 
        searchIndex: currentIndex 
      });
      
      // Get LLM suggestion for next strategy (skip the search)
      const strategy = await getNextSearchStrategy(currentKeywords, currentIndex, 0, baseKeywords, searchedCombinations);
      
      if (strategy.action === 'stop_searching') {
        logger.info('LLM suggested stopping search after duplicate', { 
          attempt: attempts,
          reason: strategy.reason,
          bestProductCount: bestResults.productCount
        });
        break;
      } else if (strategy.action === 'change_keywords' && strategy.newKeywords) {
        currentKeywords = strategy.newKeywords;
        logger.info('LLM suggested keyword change after duplicate', { 
          attempt: attempts,
          newKeywords: currentKeywords,
          reason: strategy.reason
        });
      } else if (strategy.action === 'change_index' && strategy.newSearchIndex) {
        currentIndex = strategy.newSearchIndex;
        logger.info('LLM suggested index change after duplicate', { 
          attempt: attempts,
          newIndex: currentIndex,
          reason: strategy.reason
        });
      } else {
        logger.warn('Invalid LLM strategy after duplicate, stopping', { 
          attempt: attempts,
          strategy 
        });
        break;
      }
      
      continue; // Skip to next iteration
    }
    
    // Mark this combination as searched
    searchedCombinations.add(searchKey);
    
    try {
      logger.info('Search attempt', { 
        attempt: attempts,
        keywords: currentKeywords, 
        searchIndex: currentIndex 
      });
      
      const results = await searchAmazonProducts(currentKeywords, {
        accessKeyId: process.env.MULA_AMAZON_ASSOC_ACCESS_KEY_ID,
        secretKey: process.env.MULA_AMAZON_ASSOC_SECRET_KEY,
        accountId: process.env.MULA_AMAZON_ASSOC_ACCOUNT_ID,
        searchIndex: currentIndex
      });
      
      const productCount = results.products.length;
      logger.info('Search results', { 
        attempt: attempts,
        keywords: currentKeywords, 
        searchIndex: currentIndex, 
        productCount 
      });
      
      // Keep track of best results so far
      if (productCount > bestResults.productCount) {
        bestResults = {
          products: results.products,
          successfulKeywords: currentKeywords,
          successfulSearchIndex: currentIndex,
          productCount,
          isGoldStar: productCount >= goldStarProducts
        };
      }
      
      // If we hit our target, return the results
      if (productCount >= targetProducts) {
        logger.info('Target reached!', { 
          attempt: attempts,
          keywords: currentKeywords, 
          searchIndex: currentIndex, 
          productCount,
          targetProducts,
          goldStar: productCount >= goldStarProducts
        });
        
        return {
          products: results.products,
          successfulKeywords: currentKeywords,
          successfulSearchIndex: currentIndex,
          productCount,
          isGoldStar: productCount >= goldStarProducts
        };
      }
      
      // Get LLM suggestion for next strategy
      const strategy = await getNextSearchStrategy(currentKeywords, currentIndex, productCount, baseKeywords, searchedCombinations);
      
      if (strategy.action === 'stop_searching') {
        logger.info('LLM suggested stopping search', { 
          attempt: attempts,
          reason: strategy.reason,
          bestProductCount: bestResults.productCount
        });
        break;
      } else if (strategy.action === 'change_keywords' && strategy.newKeywords) {
        currentKeywords = strategy.newKeywords;
        logger.info('LLM suggested keyword change', { 
          attempt: attempts,
          newKeywords: currentKeywords,
          reason: strategy.reason
        });
      } else if (strategy.action === 'change_index' && strategy.newSearchIndex) {
        currentIndex = strategy.newSearchIndex;
        logger.info('LLM suggested index change', { 
          attempt: attempts,
          newIndex: currentIndex,
          reason: strategy.reason
        });
      } else {
        logger.warn('Invalid LLM strategy, stopping', { 
          attempt: attempts,
          strategy 
        });
        break;
      }
      
    } catch (error) {
      logger.warn('Search attempt failed', { 
        attempt: attempts,
        keywords: currentKeywords, 
        searchIndex: currentIndex, 
        error: error.message 
      });
      
      // On error, try broader approach
      currentIndex = 'All';
      currentKeywords = baseKeywords.split(' ')[0];
    }
  }
  
  // Return best results found, even if we didn't reach target
  logger.info('Progressive search completed', { 
    attempts,
    bestProductCount: bestResults.productCount,
    targetProducts,
    reachedTarget: bestResults.productCount >= targetProducts,
    searchedCombinations: Array.from(searchedCombinations)
  });
  
  return bestResults;
}

/**
 * Process a search query using the new orchestrator
 * @param {Object} job - The Bull job object containing data
 */
async function processSearchQuery(job) {
  const { pageId } = job.data;
  logger.info('Processing search query', { pageId });

  try {
    const page = await Page.findByPk(pageId);
    if (!page) {
      throw new Error(`Could not find page with ID: ${pageId}`);
    }

    // Get credentialId from job data - must be provided
    const orchestrator = new SearchOrchestrator();
    const hostname = new URL(page.url).hostname;
    const platform = orchestrator.getPlatformForDomain(hostname);
    
    const credentialId = job.data.credentialId;
    if (!credentialId) {
      throw new Error('credentialId is required for search processing. Please provide credentials when queuing the search job.');
    }
    
    const bestSearch = await orchestrator.orchestrateSearch(pageId, credentialId, page.searchStrategy || 'progressive');

    logger.info('Search processing complete', { 
      pageId,
      bestSearchId: bestSearch.id,
      productCount: bestSearch.productCount,
      qualityScore: bestSearch.qualityScore
    });

    return bestSearch;
  } catch (error) {
    logger.error('Error processing search', error, { pageId });
    throw error;
  }
}



/**
 * Process a search directly by search ID (for site targeting)
 * @param {number} searchId - The search ID to process
 */
async function processSearchById(searchId) {
  logger.info('Processing search by ID using orchestration', { searchId });

  try {
    // Use the search orchestrator to process the search
    const SearchOrchestrator = require('../helpers/SearchOrchestrator');
    const orchestrator = new SearchOrchestrator();
    
    const results = await orchestrator.processSearchById(searchId);

    // Send results for approval using the existing orchestration method
    // Create a mock page object for the approval process
    const mockPage = {
      id: null,
      url: `Site Targeting Search: ${results.phrase}`,
      searchId: results.id
    };

    await orchestrator.sendSearchResultsForApproval(mockPage, results);

    logger.info('Search processing complete using orchestration', { 
      searchId,
      productCount: results.productCount,
      qualityScore: results.qualityScore
    });

    return results;
  } catch (error) {
    logger.error('Error processing search by ID', error, { searchId });
    
    // Update search status to failed
    const search = await Search.findByPk(searchId);
    if (search) {
      await search.update({ status: 'failed' });
    }
    
    throw error;
  }
}

/**
 * Process a search feedback and restart with new keywords
 * @param {Object} data - The job data
 * @param {string|number} data.pageId
 * @param {string} data.url
 * @param {string} data.feedback
 * @param {string} data.userId
 * @param {string} data.channelId
 * @param {string} data.messageTs
 */
async function processSearchFeedback({ pageId, url, feedback, userId, channelId, messageTs }) {
  logger.info('Processing search feedback', { pageId, url, feedback, userId, channelId, messageTs });
  
  try {
    const page = await Page.findByPk(pageId);
    if (!page) {
      throw new Error(`Page not found: ${pageId}`);
    }

    // Update page with feedback
    await page.update({
      keywordFeedback: feedback,
      searchStatus: 'pending' // Reset search status
    });

    // Get credentialId from the existing search
    const existingSearch = await Search.findByPk(page.searchId);
    if (!existingSearch || !existingSearch.credentialId) {
      throw new Error(`No credentialId found for search ${page.searchId}. Cannot proceed with feedback.`);
    }

    // Use the orchestrator to restart search with new strategy
    const orchestrator = new SearchOrchestrator();
    const bestSearch = await orchestrator.orchestrateSearch(pageId, existingSearch.credentialId, 'progressive');

    logger.info('Search feedback processing complete', { pageId, bestSearchId: bestSearch.id });
    
    return bestSearch;
  } catch (error) {
    logger.error('Error processing search feedback', error, { pageId, url });
    throw error;
  }
}

module.exports = {
  processSearchQuery,
  processSearchById,
  processSearchFeedback
}; 