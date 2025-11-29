const { OpenAI } = require('openai');
const { getJson } = require("serpapi");
const ProductAdvertisingAPIv1 = require('paapi5-nodejs-sdk');
const config = require('../config');
const { createLogger } = require('./LoggingHelpers');

const logger = createLogger('ProductHelpers');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Amazon Associates API client
const defaultClient = ProductAdvertisingAPIv1.ApiClient.instance;
defaultClient.host = 'webservices.amazon.com';
defaultClient.region = 'us-east-1';
const amazonApi = new ProductAdvertisingAPIv1.DefaultApi();

// Function to transform Amazon product to match expected format
const transformAmazonProduct = (item, position) => {
  const itemInfo = item.ItemInfo;
  const offers = item.Offers?.Listings?.[0];
  const images = item.Images;

  return {
    position,
    title: itemInfo.Title.DisplayValue,
    product_link: item.DetailPageURL,
    product_id: item.ASIN,
    source: itemInfo.ByLineInfo?.Brand?.DisplayValue || "Amazon",
    source_icon: "https://cdn.makemula.ai/amazon-icon.png",
    multiple_sources: false,
    price: offers?.Price?.DisplayAmount || "Price not available",
    extracted_price: offers?.Price?.Amount || null,
    rating: "4",
    reviews: null,
    extensions: [],
    thumbnail: images?.Primary?.Large?.URL || images?.Primary?.Medium?.URL,
    thumbnails: [images?.Primary?.Large?.URL, images?.Primary?.Medium?.URL],
    tag: null,
    delivery: offers?.DeliveryInfo?.IsPrimeEligible ? "Prime Eligible" : null,
    description: itemInfo.Features?.DisplayValues?.[0] || itemInfo.ProductInfo?.ProductType?.DisplayValue || "",
    brand: itemInfo.ByLineInfo?.Brand?.DisplayValue,
    about_the_product: itemInfo.Features?.DisplayValues?.join(" ") || "",
    stores: [{
      name: "Amazon",
      price: offers?.Price?.DisplayAmount,
      link: item.DetailPageURL
    }],
    data_source: "amazon_associates"
  };
};

// Utility function for retrying operations
const withRetry = async (operation, context, retries = config.amazon.retries) => {
  let attempts = 0;
  while (attempts < retries) {
    try {
      return await operation();
    } catch (error) {
      attempts++;
      
      // Enhanced error logging for Amazon API failures
      const errorDetails = {
        context,
        attempt: attempts,
        maxRetries: retries,
        errorType: error.constructor.name,
        errorMessage: error.message,
        errorCode: error.code || error.status || error.statusCode,
        errorResponse: error.response?.data || error.body || error.data,
        errorHeaders: error.response?.headers || error.headers,
        timestamp: new Date().toISOString()
      };
      
      // Log specific Amazon API error details
      if (error.response?.data) {
        errorDetails.amazonErrorCode = error.response.data.Errors?.[0]?.Code;
        errorDetails.amazonErrorMessage = error.response.data.Errors?.[0]?.Message;
        errorDetails.amazonRequestId = error.response.data.RequestId;
      }
      
      logger.error(`Amazon API operation failed (attempt ${attempts}/${retries})`, error, errorDetails);
      
      if (attempts === retries) {
        logger.error(`Amazon API operation failed after ${retries} attempts`, error, errorDetails);
        throw error;
      }
      
      const delay = Math.pow(2, attempts) * 1000;
      logger.info(`Retrying Amazon API operation in ${delay}ms`, { context, attempt: attempts });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Function to normalize product responses
const normalizeProductResponse = (products, source) => {
  const normalizedProducts = Array.isArray(products) ? products : 
                           products.SearchResult?.Items || 
                           products.shopping_results || [];

  return {
    source,
    products: normalizedProducts,
    timestamp: new Date().toISOString(),
    count: normalizedProducts.length
  };
};

// Function to search Amazon products
const searchAmazonProducts = async (keywords, amazonAssociate) => {
  logger.info('Searching Amazon products', { 
    keywords, 
    searchIndex: amazonAssociate.searchIndex,
    host: config.amazon.host,
    region: config.amazon.region,
    pageSize: config.amazon.pageSize,
    pagesToFetch: config.amazon.pagesToFetch,
    minRating: config.amazon.minRating
  });
  
  const allItems = [];
  const pagesToFetch = config.amazon.pagesToFetch;
  
  // Initialize client with current credentials
  const client = ProductAdvertisingAPIv1.ApiClient.instance;
  client.accessKey = amazonAssociate.accessKeyId;
  client.secretKey = amazonAssociate.secretKey;
  client.host = config.amazon.host;
  client.region = config.amazon.region;
  const api = new ProductAdvertisingAPIv1.DefaultApi();
  
  logger.info('Amazon API client initialized', {
    accessKeyId: amazonAssociate.accessKeyId ? '***' + amazonAssociate.accessKeyId.slice(-4) : 'undefined',
    accountId: amazonAssociate.accountId,
    host: client.host,
    region: client.region
  });
  
  for (let page = 1; page <= pagesToFetch; page++) {
    const searchItemsRequest = new ProductAdvertisingAPIv1.SearchItemsRequest();
    searchItemsRequest['PartnerTag'] = amazonAssociate.accountId;
    searchItemsRequest['PartnerType'] = 'Associates';
    searchItemsRequest['Keywords'] = keywords;
    searchItemsRequest['SearchIndex'] = amazonAssociate.searchIndex || 'All';
    searchItemsRequest['ItemCount'] = config.amazon.pageSize;
    searchItemsRequest['MinReviewsRating'] = config.amazon.minRating;
    searchItemsRequest['ItemPage'] = page;
    searchItemsRequest['Resources'] = [
      'ItemInfo.Title',
      'ItemInfo.Features',
      'ItemInfo.ProductInfo',
      'ItemInfo.TechnicalInfo',
      'ItemInfo.ByLineInfo',
      'Offers.Listings.Price',
      'Images.Primary.Medium',
      'Images.Primary.Large'
    ];

    try {
      logger.info(`Fetching Amazon search page ${page}/${pagesToFetch}`, {
        keywords,
        searchIndex: searchItemsRequest['SearchIndex'],
        itemCount: searchItemsRequest['ItemCount'],
        minRating: searchItemsRequest['MinReviewsRating'],
        partnerTag: searchItemsRequest['PartnerTag']
      });
      
      const pageResults = await withRetry(
        () => new Promise((resolve, reject) => {
          const callback = function(error, data, response) {
            if (error) {
              logger.error(`Amazon API callback error for page ${page}`, error, {
                keywords,
                searchIndex: searchItemsRequest['SearchIndex'],
                errorType: error.constructor.name,
                errorMessage: error.message,
                errorCode: error.code || error.status || error.statusCode
              });
              reject(error);
                         } else {
               logger.info(`Amazon API success for page ${page}`, {
                 keywords,
                 searchIndex: searchItemsRequest['SearchIndex'],
                 hasData: !!data,
                 dataKeys: data ? Object.keys(data) : [],
                 responseStatus: response?.status,
                 hasErrors: data?.Errors?.length > 0,
                 hasSearchResult: !!data?.SearchResult,
                 searchResultKeys: data?.SearchResult ? Object.keys(data.SearchResult) : []
               });
               resolve(ProductAdvertisingAPIv1.SearchItemsResponse.constructFromObject(data));
             }
          };
          api.searchItems(searchItemsRequest, callback);
        }),
        `amazon-search-page-${page}`
      );

      if (pageResults.SearchResult?.Items) {
        allItems.push(...pageResults.SearchResult.Items);
        logger.info(`Successfully fetched ${pageResults.SearchResult.Items.length} items from page ${page}`, {
          keywords,
          searchIndex: searchItemsRequest['SearchIndex'],
          totalItemsSoFar: allItems.length
        });
      } else {
        // Log Amazon API errors if present
        const amazonErrors = pageResults.Errors || [];
        const errorDetails = amazonErrors.map(error => ({
          code: error.Code,
          message: error.Message
        }));
        
        logger.warn(`No items found in page ${page} response`, {
          keywords,
          searchIndex: searchItemsRequest['SearchIndex'],
          pageResultsKeys: pageResults ? Object.keys(pageResults) : [],
          searchResultKeys: pageResults.SearchResult ? Object.keys(pageResults.SearchResult) : [],
          amazonErrors: errorDetails,
          hasErrors: amazonErrors.length > 0
        });
        
        if (amazonErrors.length > 0) {
          logger.error(`Amazon API returned errors for page ${page}`, {
            keywords,
            searchIndex: searchItemsRequest['SearchIndex'],
            errors: errorDetails
          });
        }
        
        // If first page has no results, stop searching - subsequent pages likely won't have results either
        if (page === 1) {
          logger.info(`Stopping search after page 1 - no products found and likely no products in subsequent pages`, {
            keywords,
            searchIndex: searchItemsRequest['SearchIndex'],
            amazonErrors: errorDetails
          });
          break;
        }
      }

      // Add a small delay between pages to avoid rate limiting
      if (page < pagesToFetch && pageResults.SearchResult?.Items) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      logger.error(`Failed to fetch Amazon search page ${page}/${pagesToFetch}`, error, {
        keywords,
        searchIndex: searchItemsRequest['SearchIndex'],
        errorType: error.constructor.name,
        errorMessage: error.message,
        errorCode: error.code || error.status || error.statusCode,
        willContinue: page < pagesToFetch
      });
      
      if (page === 1) {
        // If first page fails, this is a critical error
        logger.error(`Critical: First page of Amazon search failed`, error, {
          keywords,
          searchIndex: searchItemsRequest['SearchIndex'],
          amazonAssociate: {
            accessKeyId: amazonAssociate.accessKeyId ? '***' + amazonAssociate.accessKeyId.slice(-4) : 'undefined',
            accountId: amazonAssociate.accountId,
            host: client.host,
            region: client.region
          }
        });
      }
      
      continue;
    }
  }

  const result = normalizeProductResponse(allItems, 'amazon');
  
  logger.info(`Amazon search completed`, {
    keywords,
    searchIndex: amazonAssociate.searchIndex,
    totalItemsFound: allItems.length,
    pagesRequested: pagesToFetch,
    pagesSuccessful: allItems.length > 0 ? 'at least 1' : 0,
    resultCount: result.count,
    resultSource: result.source
  });
  
  return result;
};

// Function to search Google Shopping products
const searchGoogleShoppingProducts = async (keywords) => {
  logger.info('Searching Google Shopping products', { keywords });
  
  const results = await withRetry(
    () => getJson({
      engine: "google_shopping",
      q: keywords,
      location: config.serpapi.location,
      hl: config.serpapi.language,
      gl: config.serpapi.country,
      direct_link: true,
      api_key: process.env.SERP_API_KEY
    }),
    'google-shopping-search'
  );

  return normalizeProductResponse(results, 'google');
};

// Function to search Fanatics products via Impact API
const searchFanaticsProducts = async (keywords, impactConfig = {}) => {
  logger.info('Searching Fanatics products via Impact API', { keywords });
  
  const allItems = [];
  const pagesToFetch = impactConfig.maxPages || config.impact.maxPages;
  
  for (let page = 1; page <= pagesToFetch; page++) {
    try {
      const url = `${config.impact.baseUrl}/${config.impact.accountId}/${config.impact.catalogId}`;
      const params = new URLSearchParams({
        Keyword: keywords,
        Page: page.toString(),
        PageSize: (impactConfig.pageSize || config.impact.pageSize).toString()
      });

      const response = await withRetry(
        () => fetch(`${url}?${params}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${config.impact.username}:${config.impact.password}`).toString('base64')}`
          }
        }),
        `fanatics-search-page-${page}`
      );

      if (!response.ok) {
        throw new Error(`Impact API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.Items && Array.isArray(data.Items)) {
        allItems.push(...data.Items);
      }

      // Add a small delay between pages to avoid rate limiting
      if (page < pagesToFetch) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      logger.error(`Failed to fetch Fanatics page ${page}`, error);
      continue;
    }
  }

  return normalizeProductResponse(allItems, 'fanatics');
};

// Function to transform Fanatics product to standard format
const transformFanaticsProduct = (item, position) => {
  return {
    position,
    title: item.Name || 'Unknown Product',
    product_link: item.Url || '#',
    product_id: item.Id || item.CatalogItemId || `fanatics-${position}`,
    source: item.Manufacturer || 'Fanatics',
    source_icon: "https://cdn.makemula.ai/fanatics-icon.png",
    multiple_sources: false,
    price: item.CurrentPrice ? `$${item.CurrentPrice}` : (item.OriginalPrice ? `$${item.OriginalPrice}` : 'Price not available'),
    extracted_price: item.CurrentPrice ? parseFloat(item.CurrentPrice) : null,
    currency: item.Currency || 'USD',
    rating: null, // Not provided in sample
    reviews: null, // Not provided in sample
    extensions: [],
    thumbnail: item.ImageUrl || null,
    thumbnails: [item.ImageUrl, ...(item.AdditionalImageUrls || [])],
    tag: item.Category || item.SubCategory || null,
    stock: item.StockAvailability || null,
    delivery: null, // Not provided in sample
    description: item.Description || '',
    brand: item.Manufacturer || null,
    about_the_product: item.Description || '',
    size: item.Size || null,
    gender: item.Gender || null,
    age_group: item.AgeGroup || null,
    gtin: item.Gtin || null,
    mpn: item.Mpn || null,
    campaign: item.CampaignName || null,
    stores: [{
      name: "Fanatics",
      price: item.CurrentPrice ? `$${item.CurrentPrice}` : undefined,
      link: item.Url
    }],
    data_source: "fanatics_impact"
  };
};

// Function to generate product descriptions
const generateProductDescriptions = async (products, textContent) => {
  logger.info('Generating product descriptions', { productCount: products.length });
  
  const productsLite = products.map((p) => ({
    position: p.position,
    title: p.title
  }));

  const descriptionsResponse = await withRetry(
    () => openai.chat.completions.create({
      model: config.openai.model,
      response_format: {
        type: "json_object"
      },
      messages: [
        {
          role: 'system',
          content: 'You are an assistant specialized in writing product descriptions in the same style & tone as an existing article. You only return JSON responses.',
        },
        {
          role: 'user',
          content: `Generate and append a description property matching the given style & tone grist to every product in the given JSON product array. Only generate one sentence per product. Return only a JSON object with a single property "products" that contains the augmented array.\n\n-----\n\nStyle & Tone Grist:\n${textContent}\n\n-----\n\nJSON product array:\n${JSON.stringify(productsLite)}`,
        },
      ],
    }),
    'openai-descriptions'
  );

  const descriptions = JSON.parse(descriptionsResponse.choices[0].message.content).products;

  // Add descriptions to products
  const productsWithDescriptions = products.map((product, index) => {
    const description = descriptions.find(d => d.position === product.position);
    return {
      ...product,
      description: description?.description || product.description
    };
  });

  logger.info('Successfully generated descriptions', { 
    productCount: productsWithDescriptions.length 
  });

  return productsWithDescriptions;
};

module.exports = {
  transformAmazonProduct,
  transformFanaticsProduct,
  searchAmazonProducts,
  searchGoogleShoppingProducts,
  searchFanaticsProducts,
  generateProductDescriptions,
  defaultClient,
  withRetry
}; 