const { createLogger } = require('./LoggingHelpers');
const { Search, Page } = require('../models');
const AmazonSearchStrategy = require('./strategies/AmazonSearchStrategy');
const GoogleShoppingSearchStrategy = require('./strategies/GoogleShoppingSearchStrategy');
const FanaticsSearchStrategy = require('./strategies/FanaticsSearchStrategy');
const { sendSlackMessage } = require('./SlackHelpers');
const { uploadJsonToS3, getFile } = require('./S3Helpers');
const { getSearchURLs, getPageURLs } = require('./URLHelpers');
const { transformAmazonProduct, transformFanaticsProduct } = require('./ProductHelpers');

const logger = createLogger('SearchOrchestrator');

// Available search strategies
const SEARCH_STRATEGIES = {
  amazon: new AmazonSearchStrategy(),
  google_shopping: new GoogleShoppingSearchStrategy(),
  fanatics: new FanaticsSearchStrategy()
};

class SearchOrchestrator {
  constructor() {
    this.strategies = SEARCH_STRATEGIES;
  }

  /**
   * Determine the appropriate platform based on domain
   * @param {string} hostname - The hostname to check
   * @returns {string} The platform to use
   */
  getPlatformForDomain(hostname) {
    // Extract TLD from hostname (e.g., "dev.www.on3.com" -> "on3.com")
    const hostnameParts = hostname.split('.');
    const tld = hostnameParts.length >= 2 
      ? hostnameParts.slice(-2).join('.') 
      : hostname;

    // Domain-specific platform mappings (by TLD)
    const domainPlatformMap = {
      'on3.com': 'fanatics'
    };

    return domainPlatformMap[tld] || 'amazon'; // Default to Amazon
  }



  /**
   * Orchestrate progressive search across multiple platforms
   * @param {number} pageId - The page ID to search for
   * @param {string} strategy - Search strategy ('single', 'progressive', 'multi_platform')
   * @returns {Promise<Object>} Best search results
   */
  async orchestrateSearch(pageId, credentialId, strategy = 'progressive') {
    if (!credentialId) {
      throw new Error('credentialId is required for orchestrateSearch');
    }
    
    logger.info('Starting search orchestration', { pageId, credentialId, strategy });

    try {
      const page = await Page.findByPk(pageId, {
        include: [{
          model: Search,
          as: 'Search'
        }]
      });
      if (!page) {
        throw new Error(`Page not found: ${pageId}`);
      }

      // Update page status
      await page.update({ searchStatus: 'searching' });

      // Determine platform based on domain
      const hostname = new URL(page.url).hostname;
      const platform = this.getPlatformForDomain(hostname);
      
      logger.info('Selected platform for domain', { hostname, platform });

      let bestSearch = null;

      // Use progressive search for all scenarios (new pages and feedback)
      if (strategy === 'single') {
        // Single search with domain-appropriate platform
        bestSearch = await this.performSingleSearch(page, platform, credentialId);
      } else if (strategy === 'progressive') {
        // Progressive search with domain-appropriate platform (default for new pages and feedback)
        bestSearch = await this.performProgressiveSearch(page, platform, credentialId);
      } else if (strategy === 'multi_platform') {
        // Multi-platform search
        bestSearch = await this.performMultiPlatformSearch(page, credentialId);
      }

      if (bestSearch) {
        // Update page with best search
        await page.update({
          searchId: bestSearch.id,
          searchStatus: 'completed',
          searchAttempts: page.searchAttempts || []
        });

        // Send results to Slack for approval
        await this.sendSearchResultsForApproval(page, bestSearch);

        logger.info('Search orchestration completed', { 
          pageId, 
          bestSearchId: bestSearch.id,
          productCount: bestSearch.productCount,
          qualityScore: bestSearch.qualityScore
        });

        return bestSearch;
      } else {
        await page.update({ searchStatus: 'failed' });
        throw new Error('No successful search found');
      }

    } catch (error) {
      logger.error('Search orchestration failed', error, { pageId });
      throw error;
    }
  }

  /**
   * Create initial search for a new page (no existing search)
   */
  async createInitialSearch(page, platform, credentialId) {
    if (!credentialId) {
      throw new Error('credentialId is required for createInitialSearch');
    }
    logger.info('Creating initial search', { pageId: page.id, platform });

    const strategy = this.strategies[platform];
    const hostname = new URL(page.url).hostname;
    
    // Get article text from readability results for initial search
    const urls = await getPageURLs(page);
    const response = await fetch(urls.readabilityUrl);
    const readabilityResults = await response.json();
    const currentKeywords = readabilityResults.textContent || '';

    // Generate keywords
    const keywordResult = await strategy.generateKeywords(
      currentKeywords,
      hostname,
      null, // no feedback for initial search
      null // no previous keywords
    );

    // Create search record
    const finalCredentialId = credentialId;
    
    const phraseIdInput = [
      keywordResult.keywords.toLowerCase(),
      platform,
      JSON.stringify(keywordResult.platformConfig || {}),
      finalCredentialId
    ].join('|');
    
    const search = await Search.create({
      phrase: keywordResult.keywords,
      platform: platform,
      platformConfig: keywordResult.platformConfig,
      credentialId: finalCredentialId,
      status: 'pending',
      phraseID: require('crypto').createHash('sha256').update(phraseIdInput).digest('hex')
    });

    // Execute search
    const results = await strategy.executeSearch(
      keywordResult.keywords,
      keywordResult.platformConfig,
      search.credentialId
    );

    // Assess quality
    const qualityScore = await strategy.assessQuality(results.products, keywordResult.keywords);

    // Update search with results
    await search.update({
      status: 'completed',
      productCount: results.productCount,
      qualityScore: qualityScore
    });

    // Update page with search
    await page.update({ searchId: search.id });

    // Save results to S3
    logger.info('🚀 Starting S3 upload process for createInitialSearch', {
      searchId: search.id,
      phraseID: search.phraseID,
      platform: platform,
      productCount: results.productCount
    });
    
    const searchUrls = await getSearchURLs(search);
    logger.info('📁 Generated S3 URLs for createInitialSearch', {
      searchId: search.id,
      phraseID: search.phraseID,
      amazonAssociatesResultsUrl: searchUrls.amazonAssociatesResultsUrl,
      tempRecommendationsUrl: searchUrls.tempRecommendationsUrl,
      s3PathRoot: searchUrls.s3PathRoot
    });
    
    // Upload Amazon Associates results
    logger.info('📤 Uploading Amazon Associates results to S3 (createInitialSearch)', {
      searchId: search.id,
      url: searchUrls.amazonAssociatesResultsUrl,
      productCount: results.products.length
    });
    await uploadJsonToS3(searchUrls.amazonAssociatesResultsUrl, { products: results.products });
    logger.info('✅ Successfully uploaded Amazon Associates results (createInitialSearch)', {
      searchId: search.id,
      url: searchUrls.amazonAssociatesResultsUrl
    });
    
    // Transform and save to tempRecommendationsUrl
    logger.info('🔄 Starting product transformation for temp recommendations (createInitialSearch)', {
      searchId: search.id,
      platform: platform,
      productCount: results.products.length
    });
    
    if (platform === 'amazon') {
      const transformed = results.products.map((item, idx) => transformAmazonProduct(item, idx + 1));
      logger.info('📦 Transformed Amazon products for temp recommendations (createInitialSearch)', {
        searchId: search.id,
        originalCount: results.products.length,
        transformedCount: transformed.length,
        sampleTransformed: transformed[0] ? {
          position: transformed[0].position,
          title: transformed[0].title,
          product_id: transformed[0].product_id
        } : null
      });
      
      logger.info('📤 Uploading temp recommendations to S3 (createInitialSearch)', {
        searchId: search.id,
        url: searchUrls.tempRecommendationsUrl,
        transformedCount: transformed.length
      });
      await uploadJsonToS3(searchUrls.tempRecommendationsUrl, { shopping_results: transformed });
      logger.info('✅ Successfully uploaded temp recommendations (createInitialSearch)', {
        searchId: search.id,
        url: searchUrls.tempRecommendationsUrl,
        transformedCount: transformed.length
      });
    } else if (platform === 'fanatics') {
      const transformed = results.products.map((item, idx) => transformFanaticsProduct(item, idx + 1));
      logger.info('📦 Transformed Fanatics products for temp recommendations (createInitialSearch)', {
        searchId: search.id,
        originalCount: results.products.length,
        transformedCount: transformed.length
      });
      
      logger.info('📤 Uploading temp recommendations to S3 (createInitialSearch)', {
        searchId: search.id,
        url: searchUrls.tempRecommendationsUrl,
        transformedCount: transformed.length
      });
      await uploadJsonToS3(searchUrls.tempRecommendationsUrl, { shopping_results: transformed });
      logger.info('✅ Successfully uploaded temp recommendations (createInitialSearch)', {
        searchId: search.id,
        url: searchUrls.tempRecommendationsUrl,
        transformedCount: transformed.length
      });
    }
    
    logger.info('🎉 S3 upload process completed successfully for createInitialSearch', {
      searchId: search.id,
      phraseID: search.phraseID,
      platform: platform,
      productCount: results.productCount
    });

    logger.info('Initial search created successfully', {
      pageId: page.id,
      searchId: search.id,
      productCount: results.productCount,
      qualityScore: qualityScore
    });

    return search;
  }

  /**
   * Perform a single search (for existing searches with feedback)
   */
  async performSingleSearch(page, platform, credentialId) {
    if (!credentialId) {
      throw new Error('credentialId is required for performSingleSearch');
    }
    logger.info('Performing single search', { pageId: page.id, platform });

    const strategy = this.strategies[platform];
    const hostname = new URL(page.url).hostname;
    
    // Get current keywords from associated search or article text
    let currentKeywords = page.Search?.phrase;
    if (!currentKeywords) {
      // Fallback: get article text from readability results for initial search
      const urls = await getPageURLs(page);
      const response = await fetch(urls.readabilityUrl);
      const readabilityResults = await response.json();
      currentKeywords = readabilityResults.textContent || '';
    }

    // Use provided credentialId

    // Generate keywords
    const keywordResult = await strategy.generateKeywords(
      currentKeywords,
      hostname,
      page.keywordFeedback,
      null // previousKeywords
    );

    // Create or find search record
    const finalCredentialId = credentialId;
    
    const phraseIdInput = [
      keywordResult.keywords.toLowerCase(),
      platform,
      JSON.stringify(keywordResult.platformConfig || {}),
      finalCredentialId
    ].join('|');
    const [search, created] = await Search.findOrCreate({
      where: {
        phrase: keywordResult.keywords,
        platform: platform,
        platformConfig: keywordResult.platformConfig,
        credentialId: finalCredentialId
      },
      defaults: {
        status: 'pending',
        phraseID: require('crypto').createHash('sha256').update(phraseIdInput).digest('hex'),
        credentialId: finalCredentialId
      }
    });
    if (!created) {
      // If already exists, update status to pending for retry
      await search.update({ status: 'pending' });
    }

    // Execute search
    const results = await strategy.executeSearch(
      keywordResult.keywords,
      keywordResult.platformConfig,
      search.credentialId
    );

    // Assess quality
    const qualityScore = await strategy.assessQuality(
      results.products,
      keywordResult.keywords
    );

    // Update search record
    await search.update({
      productCount: results.productCount,
      qualityScore: qualityScore,
      status: 'completed',
      executedAt: new Date()
    });

    // Save results to S3
    logger.info('🚀 Starting S3 upload process for single search', {
      searchId: search.id,
      phraseID: search.phraseID,
      platform: platform,
      productCount: results.productCount
    });
    
    const urls = await getSearchURLs(search);
    logger.info('📁 Generated S3 URLs for single search', {
      searchId: search.id,
      phraseID: search.phraseID,
      amazonAssociatesResultsUrl: urls.amazonAssociatesResultsUrl,
      tempRecommendationsUrl: urls.tempRecommendationsUrl,
      s3PathRoot: urls.s3PathRoot
    });
    
    // Upload Amazon Associates results
    logger.info('📤 Uploading Amazon Associates results to S3 (single search)', {
      searchId: search.id,
      url: urls.amazonAssociatesResultsUrl,
      productCount: results.products.length
    });
    await uploadJsonToS3(urls.amazonAssociatesResultsUrl, { products: results.products });
    logger.info('✅ Successfully uploaded Amazon Associates results (single search)', {
      searchId: search.id,
      url: urls.amazonAssociatesResultsUrl
    });
    
    // Transform and save to tempRecommendationsUrl
    logger.info('🔄 Starting product transformation for temp recommendations (single search)', {
      searchId: search.id,
      platform: platform,
      productCount: results.products.length
    });
    
    if (platform === 'amazon') {
      const transformed = results.products.map((item, idx) => transformAmazonProduct(item, idx + 1));
      logger.info('📦 Transformed Amazon products for temp recommendations (single search)', {
        searchId: search.id,
        originalCount: results.products.length,
        transformedCount: transformed.length,
        sampleTransformed: transformed[0] ? {
          position: transformed[0].position,
          title: transformed[0].title,
          product_id: transformed[0].product_id
        } : null
      });
      
      logger.info('📤 Uploading temp recommendations to S3 (single search)', {
        searchId: search.id,
        url: urls.tempRecommendationsUrl,
        transformedCount: transformed.length
      });
      await uploadJsonToS3(urls.tempRecommendationsUrl, { shopping_results: transformed });
      logger.info('✅ Successfully uploaded temp recommendations (single search)', {
        searchId: search.id,
        url: urls.tempRecommendationsUrl,
        transformedCount: transformed.length
      });
    } else if (platform === 'fanatics') {
      const transformed = results.products.map((item, idx) => transformFanaticsProduct(item, idx + 1));
      logger.info('📦 Transformed Fanatics products for temp recommendations (single search)', {
        searchId: search.id,
        originalCount: results.products.length,
        transformedCount: transformed.length
      });
      
      logger.info('📤 Uploading temp recommendations to S3 (single search)', {
        searchId: search.id,
        url: urls.tempRecommendationsUrl,
        transformedCount: transformed.length
      });
      await uploadJsonToS3(urls.tempRecommendationsUrl, { shopping_results: transformed });
      logger.info('✅ Successfully uploaded temp recommendations (single search)', {
        searchId: search.id,
        url: urls.tempRecommendationsUrl,
        transformedCount: transformed.length
      });
    }
    
    logger.info('🎉 S3 upload process completed successfully for single search', {
      searchId: search.id,
      phraseID: search.phraseID,
      platform: platform,
      productCount: results.productCount
    });

    return search;
  }

  /**
   * Perform progressive search with multiple attempts
   */
  async performProgressiveSearch(page, platform, credentialId) {
    if (!credentialId) {
      throw new Error('credentialId is required for performProgressiveSearch');
    }
    logger.info('Performing progressive search', { pageId: page.id, platform });

    const strategy = this.strategies[platform];
    const hostname = new URL(page.url).hostname;
    const maxAttempts = 5;
    const targetProducts = 20;

    // Get initial keywords from associated search or article text
    let initialKeywords = page.Search?.phrase;
    if (!initialKeywords) {
      // Fallback: get article text from readability results for initial search
      const urls = await getPageURLs(page);
      const response = await fetch(urls.readabilityUrl);
      const readabilityResults = await response.json();
      initialKeywords = readabilityResults.textContent || '';
    }

    // Use provided credentialId

    let currentKeywords = initialKeywords;
    let currentConfig = {};
    let attempts = 0;
    let bestSearch = null;
    let bestScore = 0;

    while (attempts < maxAttempts) {
      attempts++;

      // Generate keywords and config
      const keywordResult = await strategy.generateKeywords(
        currentKeywords,
        hostname,
        page.keywordFeedback,
        attempts > 1 ? currentKeywords : null
      );

      // Create or find search record
      const finalCredentialId = credentialId;

      const phraseIdInput = [
        keywordResult.keywords.toLowerCase(),
        platform,
        JSON.stringify(keywordResult.platformConfig || {}),
        finalCredentialId
      ].join('|');
      const [search, created] = await Search.findOrCreate({
        where: {
          phrase: keywordResult.keywords,
          platform: platform,
          platformConfig: keywordResult.platformConfig,
          credentialId: finalCredentialId
        },
        defaults: {
          status: 'pending',
          phraseID: require('crypto').createHash('sha256').update(phraseIdInput).digest('hex'),
          credentialId: finalCredentialId
        }
      });
      if (!created) {
        // If already exists, update status to pending for retry
        await search.update({ status: 'pending' });
      }

      try {
        // Execute search
        const results = await strategy.executeSearch(
          keywordResult.keywords,
          keywordResult.platformConfig,
          search.credentialId
        );

        // Assess quality
        const qualityScore = await strategy.assessQuality(
          results.products,
          keywordResult.keywords
        );

        // Update search record
        await search.update({
          productCount: results.productCount,
          qualityScore: qualityScore,
          status: 'completed',
          executedAt: new Date()
        });

        // Save results to S3
        logger.info('🚀 Starting S3 upload process for progressive search', {
          searchId: search.id,
          phraseID: search.phraseID,
          platform: platform,
          productCount: results.productCount
        });
        
        const urls = await getSearchURLs(search);
        logger.info('📁 Generated S3 URLs for search', {
          searchId: search.id,
          phraseID: search.phraseID,
          amazonAssociatesResultsUrl: urls.amazonAssociatesResultsUrl,
          tempRecommendationsUrl: urls.tempRecommendationsUrl,
          s3PathRoot: urls.s3PathRoot
        });
        
        // Upload Amazon Associates results
        logger.info('📤 Uploading Amazon Associates results to S3', {
          searchId: search.id,
          url: urls.amazonAssociatesResultsUrl,
          productCount: results.products.length
        });
        await uploadJsonToS3(urls.amazonAssociatesResultsUrl, { products: results.products });
        logger.info('✅ Successfully uploaded Amazon Associates results', {
          searchId: search.id,
          url: urls.amazonAssociatesResultsUrl
        });
        
        // Transform and save to tempRecommendationsUrl
        logger.info('🔄 Starting product transformation for temp recommendations', {
          searchId: search.id,
          platform: platform,
          productCount: results.products.length
        });
        
        if (platform === 'amazon') {
          const transformed = results.products.map((item, idx) => transformAmazonProduct(item, idx + 1));
          logger.info('📦 Transformed Amazon products for temp recommendations', {
            searchId: search.id,
            originalCount: results.products.length,
            transformedCount: transformed.length,
            sampleTransformed: transformed[0] ? {
              position: transformed[0].position,
              title: transformed[0].title,
              product_id: transformed[0].product_id
            } : null
          });
          
          logger.info('📤 Uploading temp recommendations to S3', {
            searchId: search.id,
            url: urls.tempRecommendationsUrl,
            transformedCount: transformed.length
          });
          await uploadJsonToS3(urls.tempRecommendationsUrl, { shopping_results: transformed });
          logger.info('✅ Successfully uploaded temp recommendations', {
            searchId: search.id,
            url: urls.tempRecommendationsUrl,
            transformedCount: transformed.length
          });
        } else if (platform === 'fanatics') {
          const transformed = results.products.map((item, idx) => transformFanaticsProduct(item, idx + 1));
          logger.info('📦 Transformed Fanatics products for temp recommendations', {
            searchId: search.id,
            originalCount: results.products.length,
            transformedCount: transformed.length
          });
          
          logger.info('📤 Uploading temp recommendations to S3', {
            searchId: search.id,
            url: urls.tempRecommendationsUrl,
            transformedCount: transformed.length
          });
          await uploadJsonToS3(urls.tempRecommendationsUrl, { shopping_results: transformed });
          logger.info('✅ Successfully uploaded temp recommendations', {
            searchId: search.id,
            url: urls.tempRecommendationsUrl,
            transformedCount: transformed.length
          });
        }
        
        logger.info('🎉 S3 upload process completed successfully for progressive search', {
          searchId: search.id,
          phraseID: search.phraseID,
          platform: platform,
          productCount: results.productCount
        });

        // Track as best if better
        if (qualityScore > bestScore) {
          bestSearch = search;
          bestScore = qualityScore;
        }

        // Check if we've reached target
        if (results.productCount >= targetProducts) {
          logger.info('Target reached in progressive search', { 
            attempt: attempts,
            productCount: results.productCount,
            targetProducts
          });
          break;
        }

        // Get next strategy suggestion
        const attemptedSearches = await Search.findAll({
          where: { platform: platform },
          order: [['createdAt', 'DESC']],
          limit: 10
        });

        const nextStrategy = await strategy.suggestNextStrategy(
          keywordResult.keywords,
          keywordResult.platformConfig,
          results.productCount,
          initialKeywords,
          attemptedSearches
        );

        if (nextStrategy.action === 'stop_searching') {
          logger.info('LLM suggested stopping search', { 
            attempt: attempts,
            reason: nextStrategy.reason
          });
          break;
        } else if (nextStrategy.action === 'change_keywords' && nextStrategy.newKeywords) {
          currentKeywords = nextStrategy.newKeywords;
        } else if (nextStrategy.action === 'change_config' && nextStrategy.newConfig) {
          currentConfig = nextStrategy.newConfig;
        }

      } catch (error) {
        logger.warn('Search attempt failed', { 
          attempt: attempts,
          searchId: search.id,
          error: error.message 
        });

        await search.update({
          status: 'failed',
          errorMessage: error.message,
          executedAt: new Date()
        });
      }
    }

    return bestSearch;
  }

  /**
   * Perform multi-platform search
   */
  async performMultiPlatformSearch(page, credentialId) {
    if (!credentialId) {
      throw new Error('credentialId is required for performMultiPlatformSearch');
    }
    logger.info('Performing multi-platform search', { pageId: page.id });

    const platforms = Object.keys(this.strategies);
    const searches = [];

    // Perform single search on each platform
    for (const platform of platforms) {
      try {
        const search = await this.performSingleSearch(page, platform, credentialId);
        searches.push(search);
      } catch (error) {
        logger.warn('Platform search failed', { 
          platform, 
          error: error.message 
        });
      }
    }

    // Find best search
    let bestSearch = null;
    let bestScore = 0;

    for (const search of searches) {
      if (search.qualityScore > bestScore) {
        bestSearch = search;
        bestScore = search.qualityScore;
      }
    }

    return bestSearch;
  }

  /**
   * Send search results to Slack for approval
   */
  async sendSearchResultsForApproval(page, search) {
    const urls = await getSearchURLs(search);
    let products = [];
    let productBlocks = [];
    
    // Detect if this is a site targeting search (no page ID)
    const isSiteTargeting = !page.id;
    
    try {
      // Try temp recommendations first (shopping_results)
      let response = await fetch(urls.tempRecommendationsUrl);
      if (response.ok) {
        const data = await response.json();
        products = data.shopping_results || data.products || [];
      }
      // Fallback to amazonAssociatesResultsUrl (products)
      if (!products.length) {
        response = await fetch(urls.amazonAssociatesResultsUrl);
        if (response.ok) {
          const data = await response.json();
          products = data.products || [];
        }
      }
      if (products.length > 0) {
        productBlocks = products.slice(0, 5).map((p, i) => ({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${i + 1}. <${p.product_link || p.link}|${p.title}>*\n${p.price || ''}`
          },
          ...(p.thumbnail ? {
            accessory: {
              type: 'image',
              image_url: p.thumbnail,
              alt_text: p.title
            }
          } : {})
        }));
      } else {
        productBlocks = [{
          type: 'section',
          text: { type: 'mrkdwn', text: '_No products found or failed to load product results._' }
        }];
      }
    } catch (e) {
      productBlocks = [{
        type: 'section',
        text: { type: 'mrkdwn', text: `:warning: Failed to load product results: ${e.message}` }
      }];
    }

    const title = isSiteTargeting 
      ? `*Site Targeting Search Results for Approval*`
      : `*Search Results for Approval*\nURL: ${page.url}`;

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${title}\n\n*Search Details:*\n• Keywords: ${search.phrase}\n• Platform: ${search.platform}\n• Search Index: ${search.platformConfig?.searchIndex || 'N/A'}\n• Credentials: ${search.credentialId || 'N/A'}\n• Products Found: ${search.productCount}\n• Quality Score: ${(search.qualityScore * 100).toFixed(1)}%`
        }
      },
      ...productBlocks,
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `🔍 *Search ID: ${search.id}* | 📊 *${search.productCount} products found*${isSiteTargeting ? ' | 🎯 *Site Targeting*' : ''}`
          }
        ]
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Approve', emoji: true },
            style: 'primary',
            value: JSON.stringify({ 
              searchId: search.id, 
              pageId: page.id, 
              url: page.url,
              isSiteTargeting: isSiteTargeting 
            }),
            action_id: isSiteTargeting ? 'approve_site_targeting_search' : 'approve_products'
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Reject', emoji: true },
            style: 'danger',
            value: JSON.stringify({ 
              searchId: search.id, 
              pageId: page.id, 
              url: page.url,
              isSiteTargeting: isSiteTargeting 
            }),
            action_id: isSiteTargeting ? 'reject_site_targeting_search' : 'reject_products'
          }
        ]
      }
    ];

    const message = isSiteTargeting 
      ? `Site targeting search results ready for approval: "${search.phrase}"`
      : `Search results ready for approval: ${page.url}`;

    await sendSlackMessage(
      process.env.SLACK_SEARCH_CHANNEL,
      message,
      blocks
    );
  }

  /**
   * Get all search attempts for a page
   */
  async getSearchAttempts(pageId) {
    const page = await Page.findByPk(pageId);
    if (!page) {
      throw new Error(`Page not found: ${pageId}`);
    }

    const searches = await Search.findAll({
      where: { id: page.searchAttempts || [] },
      order: [['qualityScore', 'DESC']]
    });

    return searches;
  }

  /**
   * Select a different search for a page
   */
  async selectSearch(pageId, searchId) {
    const page = await Page.findByPk(pageId);
    const search = await Search.findByPk(searchId);

    if (!page || !search) {
      throw new Error('Page or search not found');
    }

    await page.update({ searchId: search.id });

    logger.info('Search selected for page', { 
      pageId, 
      searchId,
      productCount: search.productCount,
      qualityScore: search.qualityScore
    });

    return search;
  }

  /**
   * Process a search by ID using the orchestration pipeline
   * @param {number} searchId - The search ID to process
   * @returns {Promise<Object>} The processed search with results
   */
  async processSearchById(searchId) {
    logger.info('Processing search by ID using orchestration', { searchId });

    try {
      const search = await Search.findByPk(searchId);
      if (!search) {
        throw new Error(`Search not found: ${searchId}`);
      }

      // Update search status
      await search.update({ status: 'searching' });

      // Try to find a better search index if we're using the default 'All'
      let indexOptimized = false;
      if (search.platformConfig?.searchIndex === 'All') {
        try {
          const amazonStrategy = this.strategies.amazon;
          const betterIndex = await amazonStrategy.selectSearchIndex(search.phrase);
          
          if (betterIndex && betterIndex !== 'All') {
            await search.update({
              platformConfig: { ...search.platformConfig, searchIndex: betterIndex }
            });
            indexOptimized = true;
            logger.info('Optimized search index', { 
              searchId, 
              originalIndex: 'All', 
              newIndex: betterIndex 
            });
          }
        } catch (error) {
          logger.warn('Failed to optimize search index', { searchId, error: error.message });
        }
      }

      // Use the platform from the search record, default to Amazon if not specified
      const platform = search.platform || 'amazon';
      const strategy = this.strategies[platform];
      
      if (!strategy) {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      // Execute the search using the strategy
      const searchIndex = search.platformConfig?.searchIndex || 'All';
      const results = await strategy.executeSearch(
        search.phrase, 
        { searchIndex }, 
        search.credentialId
      );

      if (!results || !results.products || results.products.length === 0) {
        throw new Error('No products found');
      }

      // Transform products to standard format
      const transformedProducts = results.products.map((product, index) => {
        if (platform === 'amazon') {
          return transformAmazonProduct(product, index + 1);
        } else if (platform === 'fanatics') {
          return transformFanaticsProduct(product, index + 1);
        }
        return product;
      });

      // Assess quality using the strategy
      const qualityScore = await strategy.assessQuality(transformedProducts, search.phrase);

      // Update search with results
      const updatedSearch = await search.update({
        status: 'completed',
        productCount: transformedProducts.length,
        qualityScore: qualityScore,
        platform: platform
      });

      // Upload results to S3
      const { getSearchURLs } = require('./URLHelpers');
      const { uploadJsonToS3 } = require('./S3Helpers');
      
      logger.info('🚀 Starting S3 upload process for processSearchById', {
        searchId: search.id,
        phraseID: search.phraseID,
        platform: platform,
        productCount: transformedProducts.length
      });
      
      const urls = await getSearchURLs(search);
      logger.info('📁 Generated S3 URLs for processSearchById', {
        searchId: search.id,
        phraseID: search.phraseID,
        tempRecommendationsUrl: urls.tempRecommendationsUrl,
        s3PathRoot: urls.s3PathRoot
      });
      
      const searchResults = {
        shopping_results: transformedProducts,
        productCount: transformedProducts.length,
        qualityScore: qualityScore,
        platform: platform,
        searchIndex: searchIndex,
        indexOptimized: indexOptimized
      };

      logger.info('📦 Prepared search results for S3 upload', {
        searchId: search.id,
        productCount: searchResults.productCount,
        qualityScore: searchResults.qualityScore,
        platform: searchResults.platform,
        searchIndex: searchResults.searchIndex,
        indexOptimized: searchResults.indexOptimized,
        shoppingResultsCount: searchResults.shopping_results.length
      });

      logger.info('📤 Uploading search results to S3 (processSearchById)', {
        searchId: search.id,
        url: urls.tempRecommendationsUrl,
        productCount: transformedProducts.length
      });
      
      await uploadJsonToS3(urls.tempRecommendationsUrl, searchResults);
      
      logger.info('✅ Successfully uploaded search results (processSearchById)', {
        searchId: search.id,
        url: urls.tempRecommendationsUrl,
        productCount: transformedProducts.length
      });

      logger.info('Search processing complete', { 
        searchId,
        productCount: transformedProducts.length,
        qualityScore: qualityScore,
        platform: platform,
        searchIndex: searchIndex,
        indexOptimized: indexOptimized
      });

      return {
        ...updatedSearch.toJSON(),
        products: transformedProducts,
        productCount: transformedProducts.length,
        qualityScore: qualityScore
      };

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
}

module.exports = SearchOrchestrator; 