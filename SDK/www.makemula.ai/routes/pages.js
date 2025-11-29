const crypto = require('crypto');
const express = require('express');
const Bull = require('bull');
const { Page, Search } = require('../models');
const auth = require('../middlewares/auth');
const { getPageURLs, getSearchURLs } = require('../helpers/URLHelpers');
const { approvePageSearch } = require('../helpers/PageApprovalHelpers');

const redisUrl = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';
const encoreQueue = new Bull('encoreQueue', redisUrl);
const searchQueue = new Bull('searchQueue', redisUrl);
const keywordFeedbackQueue = new Bull('keywordFeedbackQueue', redisUrl);

const router = express.Router();



router.get('/pages/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that id is a valid integer
    if (!id || id === 'null' || isNaN(parseInt(id))) {
      return res.status(400).render('error', { 
        message: 'Invalid page ID',
        error: { status: 400 }
      });
    }
    
    const pageRecord = await Page.findByPk(id);
    
    if (!pageRecord) {
      return res.status(404).render('error', { 
        message: 'Page not found',
        error: { status: 404 }
      });
    }
  
  const page = pageRecord.get();
  const pageUrl = new URL(page.url);
  const tld = pageUrl.hostname.split('.').slice(-2).join('.');
  let missingEncore = true;
  let keywords;
  let mulaRecommendationsUrl;
  let tempRecommendationsUrl;
  let search;
  let state = 'searching';

  if (page.searchId) {
    search = await Search.findByPk(page.searchId);
    if (search) {
      keywords = search.phrase;
      const searchUrls = await getSearchURLs(search);
      mulaRecommendationsUrl = searchUrls.mulaRecommendationsUrl;
      tempRecommendationsUrl = searchUrls.tempRecommendationsUrl;
    }
  } else {
    const {
      mulaRecommendationsUrl: pageMulaRecommendationsUrl,
      keywordsUrl
    } = await getPageURLs(page);
    mulaRecommendationsUrl = pageMulaRecommendationsUrl;
    const keywordsResponse = await fetch(keywordsUrl);
    if (keywordsResponse.ok) {
      keywords = await keywordsResponse.json();
    }
  }

  let feed = [];
  let tempFeed = [];
  let tempProductCount = 0;
  let searchIndex = null;
  let finalRecommendationsExist = false;
  let tempRecommendationsExist = false;

  // Check for final recommendations
  if (mulaRecommendationsUrl) {
    const encoreResponse = await fetch(mulaRecommendationsUrl);
    if (encoreResponse.ok) {
      finalRecommendationsExist = true;
      missingEncore = false;
      const shoppingResults = (await encoreResponse.json()).shopping_results;
      for (let item of shoppingResults) {
        item.id = item.product_id;
      }
      feed = JSON.stringify(shoppingResults.filter((item) => item.thumbnails));
    }
  }

  // Check for temporary recommendations
  if (tempRecommendationsUrl) {
    const tempResponse = await fetch(tempRecommendationsUrl);
    if (tempResponse.ok) {
      tempRecommendationsExist = true;
      const tempResults = (await tempResponse.json()).shopping_results;
      for (let item of tempResults) {
        item.id = item.product_id;
      }
      tempFeed = JSON.stringify(tempResults.filter((item) => item.thumbnails));
      tempProductCount = tempResults.length;
    }
  }

  // Get search index from search record
  if (search) {
    searchIndex = search.platformConfig?.searchIndex;
  }

  // Determine state
  if (finalRecommendationsExist) {
    state = 'approved';
  } else if (tempRecommendationsExist) {
    state = 'awaiting_approval';
  } else if (page.searchStatus === 'failed') {
    state = 'error';
  } else {
    state = 'searching';
  }

  const cdnUrl = process.env.CDN_URL || "https://cdn.makemula.ai";
  const domain = pageUrl.hostname;
  res.render('pages/show', {
    page, 
    search,
    missingEncore,
    cdnUrl,
    mulaRecommendationsUrl,
    tempRecommendationsUrl,
    keywords,
    tld,
    domain,
    feed,
    tempFeed,
    tempProductCount,
    searchIndex,
    state
  });
  } catch (error) {
    console.error('Error loading page:', error);
    return res.status(500).render('error', { 
      message: 'Internal server error',
      error: { status: 500 }
    });
  }
});

router.get('/pages', auth, async (req, res) => {
  const pages = (await Page.findAll()).map(page => page.get());
  // Group pages by hostname
  const groupedPages = Object.entries(pages.reduce((acc, page) => {
    try {
        const hostname = new URL(page.url).hostname;
        if (!acc[hostname]) {
            acc[hostname] = [];
        }
        acc[hostname].push(page);
    } catch (error) {
        console.error(`Invalid URL: ${page.url}`);
    }
    return acc;
  }, {})).map(([hostname, pages]) => ({ hostname, pages }));

  // Get credential data for the form - show all available credentials
  const { getCredentialIds, getCredentialNames } = require('../config/credentials');
  const amazonCredentialIds = getCredentialIds('amazon');
  const amazonCredentialNames = getCredentialNames('amazon');
  const impactCredentialIds = getCredentialIds('impact');
  const impactCredentialNames = getCredentialNames('impact');

  // Create credential options for easier template rendering
  const amazonCredentials = amazonCredentialIds.map(id => ({
    id: id,
    name: amazonCredentialNames[id]
  }));
  const impactCredentials = impactCredentialIds.map(id => ({
    id: id,
    name: impactCredentialNames[id]
  }));

  res.render('./pages/index', { 
    groupedPages,
    amazonCredentials,
    impactCredentials
  });
});

router.post('/pages', async (req, res) => {
  try {
    const { url, credentialId } = req.body;

    if (!url) {
      return res.status(400).render('error', { 
        message: 'URL is required',
        error: { status: 400 }
      });
    }

    if (!credentialId) {
      return res.status(400).render('error', { 
        message: 'Credentials are required',
        error: { status: 400 }
      });
    }

    // Validate credentialId
    const { getCredentialIds } = require('../config/credentials');
    const SearchOrchestrator = require('../helpers/SearchOrchestrator');
    const orchestrator = new SearchOrchestrator();
    const hostname = new URL(url).hostname;
    const platform = orchestrator.getPlatformForDomain(hostname);
    // Map platform to credential platform (fanatics uses impact credentials)
    const credentialPlatform = platform === 'fanatics' ? 'impact' : platform;
    const availableCreds = getCredentialIds(credentialPlatform);
    
    if (!availableCreds.includes(credentialId)) {
      return res.status(400).render('error', { 
        message: `Invalid credential ID '${credentialId}' for platform '${platform}'. Available credentials: ${availableCreds.join(', ')}`,
        error: { status: 400 }
      });
    }

    let pageRef = await Page.findOne({ where: { url } });

    if (!pageRef) {
      pageRef = await Page.create({ url });
      await encoreQueue.add('encore', { pageId: pageRef.id, credentialId });
    }

    return res.redirect(`/pages/${pageRef.id}`);
  } catch (error) {
    console.error('Error creating page:', error);
    return res.status(500).render('error', { 
      message: 'Internal server error',
      error: { status: 500 }
    });
  }
});



router.delete('/pages/:id', auth, async (req, res) => {
  try {
    const pageId = req.params.id;
    
    // Validate that id is a valid integer
    if (!pageId || pageId === 'null' || isNaN(parseInt(pageId))) {
      return res.status(400).json({ error: 'Invalid page ID' });
    }
    
    const page = await Page.findByPk(pageId);
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    await page.destroy();
    res.status(200).json({ message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/pages/:id/products/approve', auth, async (req, res) => {
  try {
    const pageId = req.params.id;
    
    // Validate that id is a valid integer
    if (!pageId || pageId === 'null' || isNaN(parseInt(pageId))) {
      return res.status(400).json({ error: 'Invalid page ID' });
    }
    
    await approvePageSearch(pageId);
    res.status(200).json({ message: 'Products approved successfully' });
  } catch (error) {
    console.error('Error approving products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/sales-enablement', auth, (req, res) => {
  res.render('pages/sales-enablement', { layout: 'main' });
});

router.get('/sales-enablement/page', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).send('Missing URL parameter');
    }

    // Decode the URL parameter since it might be encoded
    const decodedUrl = decodeURIComponent(url);
    
    let feedData;
    
    // Check if mulaSearch parameter is present in the URL to bypass getFeedDataForUrl
    let mulaSearch = null;
    try {
      const urlObj = new URL(decodedUrl);
      mulaSearch = urlObj.searchParams.get('mulaSearch');
    } catch (error) {
      // If URL parsing fails, continue without mulaSearch
    }
    
    if (mulaSearch) {
      try {
        // Fetch feed data directly from the search URL
        const searchResponse = await fetch(`https://cdn.makemula.ai/searches/${mulaSearch}/temp-recommendations.json`);
        if (searchResponse.ok) {
          const searchResults = await searchResponse.json();
          const products = searchResults.shopping_results || [];
          
          // Process products to ensure they have required fields
          for (let item of products) {
            item.id = item.product_id;
          }
          
          feedData = {
            products: products.filter((item) => item.thumbnails),
            manifest: {
              searchId: mulaSearch,
              url: decodedUrl,
              source: 'direct_search'
            }
          };
        } else {
          throw new Error(`Failed to fetch search data: ${searchResponse.status}`);
        }
      } catch (error) {
        console.error('Error fetching search data directly:', error);
        // Fall back to getFeedDataForUrl if direct fetch fails
        const cleanUrl = getCleanUrl(decodedUrl);
        feedData = await getFeedDataForUrl(cleanUrl);
      }
    } else {
      // Clean the URL by removing query parameters and hash fragments
      const cleanUrl = getCleanUrl(decodedUrl);
      
      // Fetch feed data for the cleaned URL
      feedData = await getFeedDataForUrl(cleanUrl);
    }
    
    // Return a script that sets the feed data and loads the SDK
    const script = `
      (function() {
        // Set the feed data
        window.Mula = window.Mula || {};
        window.Mula.feed = ${JSON.stringify(feedData.products)};
        window.Mula.activateSalesEnablements = true;
        
        // Create loading indicator
        var loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:#28a745;color:white;padding:15px;border-radius:8px;z-index:999999;font-family:Arial,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
        loadingDiv.innerHTML = '<div style="margin-bottom:8px;"><strong>🛠️ Mula Sales Tool</strong></div><div style="font-size:12px;">Loading SDK...</div>';
        document.body.appendChild(loadingDiv);
        
        // Load the Mula.js SDK
        var script = document.createElement('script');
        script.src = 'https://cdn.makemula.ai/js/mula.js';
        script.id = 'mula-js-sdk';
        script.async = true;
        
        script.onload = function() {
          loadingDiv.innerHTML = '<div style="margin-bottom:8px;"><strong>🛠️ Mula Sales Tool</strong></div><div style="font-size:12px;">✅ Ready!</div>';
          setTimeout(function() { loadingDiv.remove(); }, 2000);
        };
        
        script.onerror = function() {
          loadingDiv.innerHTML = '<div style="margin-bottom:8px;"><strong>🛠️ Mula Sales Tool</strong></div><div style="font-size:12px;">❌ Failed to load SDK</div>';
          setTimeout(function() { loadingDiv.remove(); }, 3000);
        };
        
        document.head.appendChild(script);
      })();
    `;
    
    res.setHeader('Content-Type', 'application/javascript');
    res.send(script);
    
  } catch (error) {
    console.error('Error serving sales enablement script:', error);
    res.status(500).send('Error loading sales enablement tool');
  }
});

// Helper function to clean URL by removing query parameters and hash fragments
function getCleanUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.origin + urlObj.pathname;
  } catch (error) {
    // If URL parsing fails, use the original URL
    return url;
  }
}

// Helper function to get feed data for a URL
async function getFeedDataForUrl(url) {
  try {
    // Look up the page in our database
    const page = await Page.findOne({ where: { url: url } });
    
    if (!page) {
      // Return empty feed if page not found
      return { products: [], manifest: {} };
    }
    
    // Get the search associated with this page
    const search = await Search.findByPk(page.searchId);
    
    if (!search) {
      return { products: [], manifest: {} };
    }
    
    // Get the search URLs to fetch product data
    const { getSearchURLs } = require('../helpers/URLHelpers');
    const searchUrls = await getSearchURLs(search);
    
    let products = [];
    
    // Try to get final recommendations first
    if (searchUrls.mulaRecommendationsUrl) {
      const encoreResponse = await fetch(searchUrls.mulaRecommendationsUrl);
      if (encoreResponse.ok) {
        const shoppingResults = (await encoreResponse.json()).shopping_results;
        for (let item of shoppingResults) {
          item.id = item.product_id;
        }
        products = shoppingResults.filter((item) => item.thumbnails);
      }
    }
    
    // If no final recommendations, try temporary recommendations
    if (products.length === 0 && searchUrls.tempRecommendationsUrl) {
      const tempResponse = await fetch(searchUrls.tempRecommendationsUrl);
      if (tempResponse.ok) {
        const tempResults = (await tempResponse.json()).shopping_results;
        for (let item of tempResults) {
          item.id = item.product_id;
        }
        products = tempResults.filter((item) => item.thumbnails);
      }
    }
    
    return {
      products: products,
      manifest: {
        pageId: page.id,
        searchId: search.id,
        url: url
      }
    };
    
  } catch (error) {
    console.error('Error getting feed data for URL:', error);
    return { products: [], manifest: {} };
  }
}

router.post('/pages/:id/products/reject', auth, async (req, res) => {
  try {
    const pageId = req.params.id;
    
    // Validate that id is a valid integer
    if (!pageId || pageId === 'null' || isNaN(parseInt(pageId))) {
      return res.status(400).json({ error: 'Invalid page ID' });
    }
    
    const { feedback } = req.body;
    const page = await Page.findByPk(pageId);
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    if (!feedback) {
      return res.status(400).json({ error: 'Feedback is required' });
    }

    if (!page.searchId) {
      return res.status(400).json({ error: 'No search record found for this page' });
    }

    // Queue product feedback processing job
    await keywordFeedbackQueue.add('processProductFeedback', {
      searchId: page.searchId,
      pageId,
      url: page.url,
      feedback,
      userId: req.user?.id || 'web-interface'
    });

    res.status(200).json({ message: 'Feedback received. New products will be generated shortly.' });
  } catch (error) {
    console.error('Error rejecting products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/pages/:id/remulaize', auth, async (req, res) => {
  try {
    const pageId = req.params.id;
    
    // Validate that id is a valid integer
    if (!pageId || pageId === 'null' || isNaN(parseInt(pageId))) {
      return res.status(400).json({ error: 'Invalid page ID' });
    }
    
    const page = await Page.findByPk(pageId);
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Reset page search state to force a new search
    await page.update({
      searchId: null,
      searchIdStatus: 'pending',
      searchStatus: 'pending',
      searchAttempts: [],
      keywordFeedback: null // Clear any previous feedback
    });

    // Queue a new search
    await searchQueue.add('search', { pageId });

    res.status(200).json({ 
      message: 'Remulaization initiated successfully',
      pageId: pageId
    });
  } catch (error) {
    console.error('Error remulaizing page:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/pages/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that id is a valid integer
    if (!id || id === 'null' || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid page ID' });
    }
    
    const page = await Page.findByPk(id);
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    let state = 'searching';
    let search = null;
    let mulaRecommendationsUrl;
    let tempRecommendationsUrl;

    if (page.searchId) {
      search = await Search.findByPk(page.searchId);
      if (search) {
        const searchUrls = await getSearchURLs(search);
        mulaRecommendationsUrl = searchUrls.mulaRecommendationsUrl;
        tempRecommendationsUrl = searchUrls.tempRecommendationsUrl;
      }
    } else {
      const { mulaRecommendationsUrl: pageMulaRecommendationsUrl } = await getPageURLs(page);
      mulaRecommendationsUrl = pageMulaRecommendationsUrl;
    }

    let finalRecommendationsExist = false;
    let tempRecommendationsExist = false;

    // Check for final recommendations
    if (mulaRecommendationsUrl) {
      const encoreResponse = await fetch(mulaRecommendationsUrl);
      if (encoreResponse.ok) {
        finalRecommendationsExist = true;
      }
    }

    // Check for temporary recommendations
    if (tempRecommendationsUrl) {
      const tempResponse = await fetch(tempRecommendationsUrl);
      if (tempResponse.ok) {
        tempRecommendationsExist = true;
      }
    }

    // Determine state
    if (finalRecommendationsExist) {
      state = 'approved';
    } else if (tempRecommendationsExist) {
      state = 'awaiting_approval';
    } else if (page.searchStatus === 'failed') {
      state = 'error';
    } else {
      state = 'searching';
    }

    res.json({ state });
  } catch (error) {
    console.error('Error getting page status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;