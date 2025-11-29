import { BROWSER, DEV } from "esm-env"
import { log, logEvent, initLogger, setGlobalEventData } from './Logger.js';
import { initTrackers, startTrackers } from './Trackers.js';
import { loadFeed } from './FeedStore.js';
import { createSHA256Hash } from './URLHelpers.js';
import { getExperimentAssignment, isVariantForced, ACTIVE_EXPERIMENT } from './ABTest.js';
import { applyGamInView } from './ViewTracker.js';
import { getCookie, setCookie, getTopLevelDomain } from './Cookies.js';
import { simpleHash } from './HashHelpers.js';
import { isBot } from './BotDetector.js';
import TopShelf from './TopShelf.svelte';
import SmartScroll from './SmartScroll.svelte';
import ProductModal from './ProductModal.svelte';
import SalesEnablementTool from "./SalesEnablementTool.js";
import './global.css';

export const preLoad = () => {
  if(typeof(MULA_TEST_MODE) === 'undefined') {
    if (/complete|interactive|loaded/.test(document.readyState)) {
      load();
    } else {
      // The document is not ready yet, so wait for the DOMContentLoaded event
      document.addEventListener('DOMContentLoaded', load, false);
    }
  }
};

let topShelf, smartScroll;

export const loadAudienceAcuityPixel = () => {
  try {
    const host = window.location.hostname;
    const sessionId = window.Mula.sessionId || 'unknown';
    const userId = window.Mula.userId || sessionId; // Fallback to sessionId if userId not available
    
    const pixelUrl = new URL('https://i.liadm.com/s/80847');
    pixelUrl.searchParams.set('cid', '68cb2ae8f76e670018c9f61a');
    pixelUrl.searchParams.set('cdata1', host);
    pixelUrl.searchParams.set('cdata2', sessionId);
    pixelUrl.searchParams.set('cdata3', userId);
    pixelUrl.searchParams.set('cdata4', '');
    
    // Create and load pixel
    const img = new Image();
    img.src = pixelUrl.toString();
    
    log(`Audience Acuity pixel loaded: ${pixelUrl.toString()}`);
  } catch (error) {
    log(`Audience Acuity pixel failed to load: ${error.message}`);
    logEvent("mula_aapx_fail", "1");
  }
};

export const loadStylesheet = () => {
  const u = new URL(window.location.href);
  let cdn_url = import.meta.env.VITE_PUBLIC_MULA_CDN_ROOT || '';
  let tlDomain = u.hostname.split('.').slice(-2).join('.'); // Extracts the top-level domain
  let href = `${Mula.sdkVersionRoot()}/js/pubs/${tlDomain}/style.css`;
  let globalHref = `${Mula.sdkVersionRoot()}/js/global.css`;
  
  if(window.location.href.indexOf("app.makemula.ai") > -1) {
    href = `${Mula.sdkVersionRoot()}/js/pubs/${window.Mula.mockHost}/style.css`;
    globalHref = `${Mula.sdkVersionRoot()}/js/global.css`;
  }
  if(window.location.href.indexOf("localhost:3000") > -1) {
    const localUrl = new URL(window.location.href);
    href = `${localUrl.origin}/public/pubs/${window.Mula.mockHost}/style.css`;
    globalHref = `${localUrl.origin}/public/global.css`;
  }

  const loadStyle = (href) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.type = 'text/css';
    document.head.appendChild(link);
    log(`Inserted stylesheet: ${link.href}`);
  };

  if (cdn_url && tlDomain) {
    // Load global styles
    loadStyle(globalHref);
    // Load domain-specific styles
    loadStyle(href);
  } else {
    log('CDN URL or top-level domain not found.');
  }
};




export const load = async () => {
  //public API
  if(BROWSER) {
    const u = new URL(window.location.href);
    const logLevel = u.searchParams.get("mulaLogLevel") || window.Mula.logLevel || 0;
    const fullStory = u.searchParams.get("mulaFullStory");
    const sessionInfo = initTrackers();
    initLogger({logLevel, fullStory}, {...Object.fromEntries(u.searchParams.entries()), ...sessionInfo});
    log("BootLoader.load");
    // Bot detection - exit early if bot is detected
    const botDetection = isBot(log);
    if (botDetection.isBot) {
      log(`Bot detected: ${botDetection.botName || 'Unknown Bot'}, exiting Mula script`);
      logEvent("bot_view", botDetection.botName || "unknown");
      return;
    }
    loadStylesheet();

    // Track session page views (for analytics)
    const sessionPageViews = parseInt(getCookie('__mula_spv') || '0', 10) + 1;
    setCookie('__mula_spv', sessionPageViews.toString(), { 
      domain: getTopLevelDomain(), 
      sameSite: 'lax' 
    });
    log(`Session page views: ${sessionPageViews}`);
    
    // Track in-view count (for product randomization logic) - 7 days
    const inViewCount = parseInt(getCookie('__mula_ivc') || '0', 10);
    setCookie('__mula_ivc', inViewCount.toString(), { 
      domain: getTopLevelDomain(), 
      sameSite: 'lax',
      days: 7
    });
    log(`In-view count: ${inViewCount}`);


    // Check for utm_source=mula and apply GAM in-view targeting immediately
    const utmSource = u.searchParams.get("utm_source");
    if (utmSource === "mula") {
      log("UTM source detected as 'mula', applying GAM in-view targeting immediately");
      applyGamInView();
    }

    // Check for sales enablement activation via query string or window.Mula
    const activateSalesEnablements = u.searchParams.get("mulaActivateSalesEnablements") || window.Mula.activateSalesEnablements;
    if (activateSalesEnablements) {
      const salesTool = new SalesEnablementTool();
      salesTool.init();
      window.Mula.salesEnablementTool = salesTool;
      log("Sales Enablement Tool activated");
    }

    // Check for fallback activation via query string
    if (u.searchParams.get("mulaFallback") === "1") {
      window.Mula.fallback = true;
      log("Fallback enabled via query string (mulaFallback=1)");
    }

    window.Mula = {
      ...window.Mula || {},
      currentUrl: new URL(window.location.href),
      feed: window.Mula?.feed || [],
      sessionId: sessionInfo.sessionId,
      userId: sessionInfo.userId,
      ...{
        getPageContext: () => {
          function extractOpenGraphData() {
            const articleSection = document.querySelector('meta[property="article:section"]')?.content;
            const tagElements = document.querySelectorAll('meta[property="article:tag"]');
            const tags = Array.from(tagElements).map(el => el.content).filter(Boolean);
            
            if (articleSection) {
              log('OG article:section:', articleSection);
            }
            if (tags.length > 0) {
              log('OG article:tags:', tags);
            }
            
            return { articleSection, tags };
          }
          
          function extractJsonLDData() {
            const scripts = document.querySelectorAll('script[type="application/ld+json"]');
            let articleSection = null;
            let tags = [];
            
            for (const script of scripts) {
              try {
                const data = JSON.parse(script.textContent);
                
                // Handle @graph structure (like TWSN.net)
                if (data['@graph'] && Array.isArray(data['@graph'])) {
                  for (const item of data['@graph']) {
                    if (item['@type'] === 'Article' || item['@type'] === 'NewsArticle' || item['@type'] === 'BlogPosting') {
                      if (item.articleSection && !articleSection) {
                        // Decode HTML entities
                        const tempElement = document.createElement('textarea');
                        tempElement.innerHTML = item.articleSection;
                        articleSection = tempElement.value;
                        log('JSON-LD articleSection (from @graph):', articleSection);
                      }
                      if (item.keywords) {
                        // Handle both string and array formats
                        const keywords = Array.isArray(item.keywords) ? item.keywords : [item.keywords];
                        tags = [...tags, ...keywords];
                        log('JSON-LD keywords (from @graph):', keywords);
                      }
                    }
                  }
                } else {
                  // Handle flat structure (like Brit.co) or array of items
                  const items = Array.isArray(data) ? data : [data];
                  for (const item of items) {
                    if (item['@type'] === 'Article' || item['@type'] === 'NewsArticle' || item['@type'] === 'BlogPosting') {
                      if (item.articleSection && !articleSection) {
                        // Decode HTML entities
                        const tempElement = document.createElement('textarea');
                        tempElement.innerHTML = item.articleSection;
                        articleSection = tempElement.value;
                        log('JSON-LD articleSection (flat):', articleSection);
                      }
                      if (item.keywords) {
                        // Handle both string and array formats
                        const keywords = Array.isArray(item.keywords) ? item.keywords : [item.keywords];
                        tags = [...tags, ...keywords];
                        log('JSON-LD keywords (flat):', keywords);
                      }
                    }
                  }
                }
              } catch (e) {
                // JSON might be malformed or not relevant
                continue;
              }
            }
            
            // Remove duplicates from tags
            tags = [...new Set(tags)];
            
            return { articleSection, tags };
          }
          
          function extractPageContext() {
            const ogData = extractOpenGraphData();
            const jsonLdData = extractJsonLDData();
            
            // Article Section: Prefer OG article:section over JSON-LD articleSection
            const articleSection = ogData.articleSection || jsonLdData.articleSection;
            
            // Tags: Accumulate from both sources
            const tags = [...new Set([
              ...(ogData.tags || []),
              ...(jsonLdData.tags || [])
            ])];
            
            // Set global event data
            if (articleSection) {
              setGlobalEventData('article_section', articleSection);
            }
            if (tags.length > 0) {
              setGlobalEventData('article_keywords', tags);
            }
            
            if (!articleSection) {
              log('No articleSection found in OG or JSON-LD');
            }
            if (tags.length === 0) {
              log('No tags found in OG or JSON-LD');
            }
            
            log('Final page context:', { articleSection, tags });
            return { articleSection, tags };
          }
          
          return extractPageContext();
        },
        showModal: (product) => {
          const modal = document.createElement('mula-product-modal');
          modal.setAttribute('product_json', JSON.stringify(product));
          document.body.appendChild(modal);
        },
        closeModal: () => {
          const modal = document.querySelector('mula-product-modal');
          if (modal) {
            modal.remove();
          }
        },
        openMulaLink: (url, product_id) => {
          const currentUrl = new URL(window.location.href);

          // Check if this is a Fanatics product and add subid=mula
          if (window.Mula.feed && window.Mula.feed.length > 0) {
            const product = window.Mula.feed.find(p => p.product_id === product_id);
            if (product && product.data_source === 'fanatics_impact') {
              const urlObj = new URL(url);
              urlObj.searchParams.set('subid1', 'mula');
              
              // Add subId2 with session ID for experiment attribution
              if (window.Mula.sessionId) {
                urlObj.searchParams.set('subid2', window.Mula.sessionId);
              }
              
              // Add subId3 if publisher has configured a function to generate it
              if (window.Mula.impact?.subid3 && typeof window.Mula.impact.subid3 === 'function') {
                const subId3Value = window.Mula.impact.subid3(currentUrl);
                if (subId3Value) {
                  urlObj.searchParams.set('subid3', subId3Value);
                }
              }
              
              url = urlObj.toString();
            }

            const DEFAULT_AMAZON_ASSOCIATES_ID = 'tag0d1d-20';
            if(url.includes(DEFAULT_AMAZON_ASSOCIATES_ID) && window.Mula.amazonAssociatesId) {
              const urlObj = new URL(url.replace(DEFAULT_AMAZON_ASSOCIATES_ID, window.Mula.amazonAssociatesId));
              url = urlObj.toString();
            }

            if(!product?.data_source && window.Mula.SkimLinksId) {
              const skimLinksUrl = new URL('https://go.skimresources.com');
              skimLinksUrl.searchParams.set('id', window.Mula.SkimLinksId);
              skimLinksUrl.searchParams.set('url', url);
              skimLinksUrl.searchParams.set('sref', currentUrl.href);
              skimLinksUrl.searchParams.set('xcust', `mula-${product_id}`);
              url = skimLinksUrl.toString();
            }
          }
          window.open(url, '_blank');
        },
        
        // A/B Test debugging functions
        getExperimentData: (experimentName, variants) => {
          return getExperimentAssignment(window.Mula.sessionId, experimentName, variants);
        },
        getVariant: (experimentName, variants) => {
          const assignment = getExperimentAssignment(window.Mula.sessionId, experimentName, variants);
          return assignment.variant;
        },
        isVariantForced: () => {
          return isVariantForced()
        },
        ACTIVE_EXPERIMENT: ACTIVE_EXPERIMENT,
        getExperimentAssignment: (experimentName, variants) => {
          // Use active experiment defaults if no parameters provided
          const expName = experimentName || window.Mula.ACTIVE_EXPERIMENT.name;
          const expVariants = variants || window.Mula.ACTIVE_EXPERIMENT.variants.map(v => typeof v === 'string' ? v : v.id);
          
          return getExperimentAssignment(window.Mula.sessionId, expName, expVariants);
        },
        boot: async () => {
          if(window.Mula.salesEnablementTool?.isActive && window.Mula.feed?.length > 0) {
            //short circuit if we're in the sales enablement tool
            return;
          }
          const currentUrl = new URL(window.location.href);
          let feedUrl = currentUrl;
          let feedFound = false; // Track if a feed was found from manifest/targeting/search
          // Check manifest
          let isManifested = false;
          let manifestSearchUrl = null;
          let manifest = null;
          
          if(window.Mula.organicConfig || window.Mula.currentUrl.searchParams.get("mulaAuto") || window.Mula.salesEnablementTool) {
            try {
              const hash = await createSHA256Hash(currentUrl.pathname);
              window.Mula.pageId = hash;
              const manifestUrl = `${import.meta.env.VITE_PUBLIC_MULA_CDN_ROOT}/${currentUrl.hostname}/manifest.json`;
              const response = await fetch(manifestUrl);
              if (response.ok) {
                manifest = await response.json();
                
                // Handle new manifest format (lookup table)
                if (manifest && typeof manifest === 'object' && !Array.isArray(manifest)) {
                  // New format: manifest is an object with page IDs as keys
                  if (manifest[hash]) {
                    isManifested = true;
                    manifestSearchUrl = manifest[hash];
                    log(`Page ${hash} is manifested, using search URL: ${manifestSearchUrl}`);
                  } else if (manifest._legacy && Array.isArray(manifest._legacy)) {
                    // Check if this page ID is in the legacy array
                    if (manifest._legacy.indexOf(hash) > -1) {
                      isManifested = true;
                      // For legacy pages, we need to find the corresponding search URL
                      // Look for the first non-legacy entry that has a search URL
                      for (const [pageId, searchUrl] of Object.entries(manifest)) {
                        if (pageId !== '_legacy' && searchUrl && searchUrl.startsWith('searches/')) {
                          manifestSearchUrl = searchUrl;
                          log(`Legacy page ${hash} mapped to search URL: ${manifestSearchUrl}`);
                          break;
                        }
                      }
                    }
                  }
                } else if (Array.isArray(manifest)) {
                  // Legacy format: manifest is an array
                  isManifested = manifest.indexOf(hash) > -1;
                  if (isManifested) {
                    log(`Page ${hash} is manifested (legacy array format)`);
                  }
                }
              }
            } catch (error) {
              console.error('Error checking manifest:', error);
            }
          }
          
          if (isManifested) {
            if (manifestSearchUrl) {
              // Use the search URL from the manifest
              feedUrl = new URL(`${import.meta.env.VITE_PUBLIC_MULA_CDN_ROOT}/${manifestSearchUrl}`);
              feedFound = true;
              log(`${currentUrl.pathname} is manifested, using search URL: ${manifestSearchUrl}`);
              
              // Extract search ID from manifest search URL and set it
              const searchID = manifestSearchUrl
                  .replace('searches/', '')
                  .replace('/results.json', '');
              setGlobalEventData('search_id', searchID);
            } else {
              // Legacy array format - construct the old page manifest URL
              feedUrl = new URL(`${import.meta.env.VITE_PUBLIC_MULA_CDN_ROOT}/${currentUrl.hostname}/pages/${hash}/index.json`);
              feedFound = true;
              log(`${currentUrl.pathname} is manifested (legacy), using page URL: pages/${hash}/index.json`);
            }
          } else {
            // Not manifested - try targeting first, then fall back to organic search phrases
            let targetingMatched = false;
            
            if (manifest && manifest._targeting) {
              // Check if current page matches any targeting rules
              log(`${currentUrl.pathname} is not manifested, checking targeting rules...`);
              
              const pageContext = window.Mula.getPageContext();
              let matchingTargeting = null;
              
              for (const targeting of manifest._targeting) {
                let matches = false;
                
                switch (targeting.type) {
                  case 'path_substring':
                    // Query-string agnostic match between specified path and current page URL
                    matches = currentUrl.pathname.includes(targeting.value);
                    break;
                    
                  case 'url_pattern':
                    // Regex match against the full URL
                    try {
                      const regex = new RegExp(targeting.value);
                      matches = regex.test(currentUrl.href);
                    } catch (error) {
                      console.warn(`Invalid regex pattern in targeting:`, targeting.value);
                      continue;
                    }
                    break;
                    
                  case 'ld_json':
                    // Match against JSON-LD articleSection
                    if (pageContext && pageContext.articleSection && targeting.value) {
                      matches = pageContext.articleSection.toLowerCase().includes(targeting.value.toLowerCase());
                    }
                    break;
                    
                  case 'keyword_substring':
                    // Match against article keywords array
                    if (pageContext && pageContext.tags && Array.isArray(pageContext.tags)) {
                      matches = pageContext.tags.some(keyword => 
                        keyword.toLowerCase().includes(targeting.value.toLowerCase())
                      );
                    }
                    break;
                }
                
                if (matches) {
                  matchingTargeting = targeting;
                  break;
                }
              }
              
              if (matchingTargeting) {
                log(`✅ Targeting match found: ${matchingTargeting.type} = ${matchingTargeting.value}`);
                // Use phraseID directly if available, otherwise fall back to hashing searchPhrase
                const searchID = matchingTargeting.phraseID || await createSHA256Hash(matchingTargeting.searchPhrase.toLowerCase());
                setGlobalEventData('search_id', searchID);
                setGlobalEventData('search_phrase', matchingTargeting.searchPhrase);
                setGlobalEventData('targeting_type', matchingTargeting.type);
                setGlobalEventData('targeting_value', matchingTargeting.value);
                feedUrl = new URL(`${import.meta.env.VITE_PUBLIC_MULA_CDN_ROOT}/searches/${searchID}/results.json`);
                feedFound = true;
                targetingMatched = true;
              } else {
                log(`❌ No targeting match found for ${currentUrl.pathname}`);
              }
            }
          }

          if(currentUrl.searchParams.get("mulaSearch")) {
            feedUrl = new URL(`${import.meta.env.VITE_PUBLIC_MULA_CDN_ROOT}/searches/${currentUrl.searchParams.get("mulaSearch")}/results.json`);
            feedFound = true;
          }

          // Check for fallback logic
          const forceFallback = currentUrl.searchParams.get("mulaForceFallback") === "1";
          const shouldUseFallback = forceFallback || (window.Mula.fallback && !feedFound);
          
          if (shouldUseFallback) {
            const tld = currentUrl.hostname.split('.').slice(-2).join('.');
            const fallbackUrl = `${Mula.sdkVersionRoot()}/js/pubs/${tld}/fallback.json`;
            feedUrl = new URL(fallbackUrl);
            log(`Using fallback.json: ${fallbackUrl}${forceFallback ? ' (forced via mulaForceFallback=1)' : ' (no manifest feed found)'}`);
            setGlobalEventData('feed_source', 'fallback');
          }

          // Check for next-page feature activation
          if(currentUrl.searchParams.get("mulaNextPage") === "1" || window.Mula.nextPage) {
            try {
              const nextPageData = await loadNextPageRecommendations(currentUrl.hostname, currentUrl.pathname, manifest);
              window.Mula.nextPage = nextPageData;
              if (nextPageData && nextPageData.length > 0) {
                log("Next page recommendations loaded:", nextPageData.length, "articles");
              } else {
                log("No next page recommendations found for current path");
              }
            } catch (error) {
              console.error('Error loading next-page recommendations:', error);
              window.Mula.nextPage = null;
            }
          }

          // Load RevContent content if configured
          if (window.Mula.revContent && typeof window.Mula.shouldShowRevContent === 'function') {
            try {
              const revContentData = await loadRevContentContent();
              window.Mula.revContentItems = revContentData;
              if (revContentData && revContentData.length > 0) {
                log("RevContent items loaded:", revContentData.length, "items");
              } else {
                log("No RevContent items loaded");
              }
            } catch (error) {
              console.error('Error loading RevContent:', error);
              window.Mula.revContentItems = [];
            }
          } else {
            window.Mula.revContentItems = [];
          }

          const renderCheck = () => {
            if(window.Mula.salesEnablementTool) {
              return true;
            }
            if(currentUrl.searchParams.get("mulaAuto")){
              return true;
            }
            if(window.Mula.auto) {
              if(typeof window.Mula.organicConfig?.targeting === 'function' && !window.Mula.organicConfig?.targeting()) {
                return false;
              }
              return true;
            }
            return false;
          };

          if(!renderCheck()) {
            return false;
          }

          const slots = Object.keys(window.Mula.organicConfig?.slots || {});
          const slotWidgets = {};
          
          if(slots.length > 0) {
            for(const slot of slots) {
              const slotConfig = window.Mula.organicConfig?.slots?.[slot];
              const widgets = Object.keys(slotConfig);
              const weightedWidgets = [];
              
              // Build weighted array
              for(const widget of widgets) {
                const p0 = slotConfig[widget];
                // Add widget to array p0 times
                for(let i = 0; i < p0; i++) {
                  weightedWidgets.push(widget);
                }
              }
              
              // Make random selection from weighted array
              if(weightedWidgets.length > 0) {
                const randomIndex = Math.floor(Math.random() * weightedWidgets.length);
                slotWidgets[slot] = weightedWidgets[randomIndex];
              }
            }
          }
          
          topShelf = document.createElement('mula-topshelf');
          smartScroll = document.createElement('mula-smartScroll');
          const res = await loadFeed(feedUrl);
          
          // Check for product_src from shopping_results data_source
          if (res && res.length > 0 && res[0].data_source) {
            setGlobalEventData('product_src', res[0].data_source);
          }
          
          // Fisher-Yates shuffle algorithm
          const shuffleArray = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
          };

          // Sort products by popularity using top-products.json with 80/20 randomization
          const sortByPopularity = async (products, host, inViewCount) => {
            try {
              // If user has seen the widget in view more than 1 time, always shuffle
              if (inViewCount >= 1) {
                log("Using shuffle sorting (user has seen widget multiple times)");
                return shuffleArray([...products]);
              }
              
              // 80% of the time, use popularity sorting; 20% of the time, randomize
              const shouldUsePopularity = Math.random() < 0.8;
              
              if (!shouldUsePopularity) {
                log("Using random sorting (20% chance)");
                return shuffleArray([...products]);
              }

              // Fetch top-products.json for this host
              const topProductsUrl = `${window.Mula.cdnHost}/${host}/top-products.json`;
              log(`Fetching top products from: ${topProductsUrl}`);
              
              const response = await fetch(topProductsUrl, { 
                method: 'GET'
                // Removed custom header to avoid preflight OPTIONS request
              });
              
              if (!response.ok) {
                log(`Failed to fetch top products (${response.status}), using random sorting`);
                return shuffleArray([...products]);
              }
              
              const topProductIds = await response.json();
              
              if (!Array.isArray(topProductIds) || topProductIds.length === 0) {
                log("Top products data is empty, using random sorting");
                return shuffleArray([...products]);
              }
              
              // Create a map for quick lookup of product positions
              const popularityMap = new Map();
              topProductIds.forEach((productId, index) => {
                popularityMap.set(productId, index);
              });
              
              // Sort products by popularity (products not in top list go to the end)
              const sortedProducts = [...products].sort((a, b) => {
                const aIndex = popularityMap.has(a.product_id) ? popularityMap.get(a.product_id) : Infinity;
                const bIndex = popularityMap.has(b.product_id) ? popularityMap.get(b.product_id) : Infinity;
                return aIndex - bIndex;
              });
              
              log(`Sorted ${products.length} products by popularity, ${popularityMap.size} products in top list`);
              return sortedProducts;
              
            } catch (error) {
              log(`Error fetching top products: ${error.message}, using random sorting`);
              return shuffleArray([...products]);
            }
          };

          const filteredRes = res.filter((item) => item.thumbnails);
          const urlParams = new URLSearchParams(window.location.search);
          const shouldShuffle = urlParams.get('mulaNoHotItems') === '1' || !res.hot_items;
          
          if (shouldShuffle) {
            // Use new popularity-based sorting instead of simple shuffle
            window.Mula.feed = await sortByPopularity(filteredRes, u.hostname, inViewCount);
          } else {
            // Legacy hot_items sorting (keeping for backward compatibility)
            window.Mula.feed = filteredRes;
          }
          
          if(res.length > 0) {
            
            const experiment = currentUrl.searchParams.get('mulaExperiment');
            const slotParams = {
              slotA: currentUrl.searchParams.get('mulaSlotA') || slotWidgets['slotA'],
              slotB: currentUrl.searchParams.get('mulaSlotB') || slotWidgets['slotB']
            };
            const widgets = {
              widget7: topShelf,
              widget15: smartScroll,
              topShelf,
              smartScroll
            };
            const caseInsensitiveWidgets = Object.fromEntries(
              Object.entries(widgets).map(([key, value]) => [key.toLowerCase(), value])
            );
            if(experiment && window.Mula.experiments[experiment])
              window.Mula.experiments[experiment](widgets);

            Object.keys(slotParams).forEach((key) => {
              const widgetName = slotParams[key];
              const widget = caseInsensitiveWidgets[widgetName?.toLowerCase()];
              if(widgetName) {
                setGlobalEventData(key, widgetName);
              }
              if(widgetName && widget) {
                window.Mula.slots[key](widget);
              }
            });

          }
          
          return res.length > 0;
        }
      }
    };
    window.Mula.getPageContext();
    startTrackers();
    logEvent("page_view", "1");

    // Load TLD's index.js only if not on localhost or app.makemula.ai
    if (!window.location.href.includes("localhost:3000") && !window.location.href.includes("app.makemula.ai")) {
      const tld = u.hostname.split('.').slice(-2).join('.');
      const tldScript = document.createElement('script');
      tldScript.src = `${Mula.sdkVersionRoot()}/js/pubs/${tld}/index.js`;
      document.head.appendChild(tldScript);
    }
    
    // Load Audience Acuity pixel as the last step
    loadAudienceAcuityPixel();
  }
};

/**
 * Loads next page recommendations using targeting rules from main manifest
 * @param {string} domain - Domain to load recommendations for
 * @param {string} currentPathname - Current page pathname
 * @param {Object} mainManifest - Main site manifest (already loaded)
 * @returns {Array|null} - Array of recommended articles or null
 */
export const loadNextPageRecommendations = async (domain, currentPathname, mainManifest) => {
  try {
    // Check if main manifest has next-page targeting rules
    if (!mainManifest || !mainManifest._nextPageTargeting || mainManifest._nextPageTargeting.length === 0) {
      log("No next-page targeting rules found in main manifest");
      return null;
    }
    
    // Get page context for JSON-LD matching
    const pageContext = window.Mula.getPageContext();
    const currentUrl = new URL(window.location.href);
    
    // Match current page against targeting rules
    let matchedTargeting = null;
    for (const targeting of mainManifest._nextPageTargeting) {
      let matches = false;
      
      switch (targeting.type) {
        case 'path_substring':
          matches = currentPathname.includes(targeting.value);
          break;
          
        case 'url_pattern':
          try {
            const regex = new RegExp(targeting.value);
            matches = regex.test(currentUrl.href);
          } catch (error) {
            console.warn(`Invalid regex pattern in next-page targeting:`, targeting.value);
            continue;
          }
          break;
          
        case 'ld_json':
          if (pageContext && pageContext.articleSection && targeting.value) {
            matches = pageContext.articleSection.toLowerCase().includes(targeting.value.toLowerCase());
          }
          break;
          
        case 'keyword_substring':
          if (pageContext && pageContext.tags && Array.isArray(pageContext.tags)) {
            matches = pageContext.tags.some(keyword => 
              keyword.toLowerCase().includes(targeting.value.toLowerCase())
            );
          }
          break;
      }
      
      if (matches) {
        matchedTargeting = targeting;
        log(`✅ Next-page targeting match found: ${targeting.type} = "${targeting.value}" (section: ${targeting.section})`);
        break; // First match wins
      }
    }
    
    if (!matchedTargeting) {
      log("No next-page targeting match found for path:", currentPathname);
      return null;
    }
    
    // Load section-specific manifest
    const sectionManifestUrl = `${import.meta.env.VITE_PUBLIC_MULA_CDN_ROOT}/${domain}/${matchedTargeting.manifest}`;
    log(`Loading section manifest: ${sectionManifestUrl}`);
    
    const sectionResponse = await fetch(sectionManifestUrl);
    
    if (!sectionResponse.ok) {
      log(`Section manifest not found or failed to load: ${sectionManifestUrl}`);
      return null;
    }
    
    const sectionManifest = await sectionResponse.json();
    const articles = sectionManifest.articles || [];
    
    if (articles.length === 0) {
      log("No articles found in section manifest");
      return null;
    }
    
    // Get visited articles from cookie
    const visitedArticles = getCookie('__mula_npv')?.split(',').filter(Boolean) || [];
    
    // Filter out URLs that match the current page pathname on the same domain
    // and filter out previously visited articles
    const currentHostname = domain;
    const filteredArticles = articles.filter(item => {
      if (!item.url) return true; // Keep items without URLs
      
      try {
        const itemUrl = new URL(item.url);
        
        // Filter out if it's the same domain AND same pathname (current page)
        if (itemUrl.hostname === currentHostname && itemUrl.pathname === currentPathname) {
          return false;
        }
        
        // Filter out if user has already visited this article
        const articleHash = simpleHash(itemUrl.pathname);
        if (visitedArticles.includes(articleHash)) {
          log(`Filtering out visited article: ${itemUrl.pathname} (hash: ${articleHash})`);
          return false;
        }
        
        return true;
      } catch (error) {
        // If URL parsing fails, keep the item
        return true;
      }
    });
    
    log(`Found ${filteredArticles.length} articles for section "${matchedTargeting.section}" (priority: ${matchedTargeting.priority})`);
    return filteredArticles;
    
  } catch (error) {
    log('Error loading next page recommendations:', error);
    return null;
  }
};

/**
 * Loads RevContent content from Trends API
 * @returns {Promise<Array>} Array of RevContent items or empty array on error
 */
export const loadRevContentContent = async () => {
  try {
    const revContentConfig = window.Mula.revContent;
    if (!revContentConfig || !revContentConfig.pubId || !revContentConfig.widgetId) {
      log('RevContent configuration not found');
      return [];
    }
    
    // Check if RevContent should be shown for this page
    const shouldShow = typeof window.Mula.shouldShowRevContent === 'function' 
      ? window.Mula.shouldShowRevContent() 
      : false;
    
    if (!shouldShow) {
      log('RevContent targeting check returned false');
      return [];
    }
    
    const domain = window.location.hostname;
    const apiUrl = `https://trends.revcontent.com/api/v2/?api_key=ea00ee4c22a6e02d37b073e27c679fef49f780b7&pub_id=${revContentConfig.pubId}&widget_id=${revContentConfig.widgetId}&domain=${domain}&sponsored_count=6&img_w=400&img_h=315&width=1280&send_view=true&format=JSON`;
    
    log('Fetching RevContent content from API');
    
    // Set timeout to prevent blocking feed loading (2 seconds)
    const timeoutMs = 2000;
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('RevContent API timeout')), timeoutMs);
    });
    
    try {
      // Race between fetch+parse and timeout
      const fetchPromise = (async () => {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`RevContent API returned ${response.status}`);
        }
        const data = await response.json();
        return data;
      })();
      
      const data = await Promise.race([fetchPromise, timeoutPromise]);
      let content = data.content || [];
      
      // Update image URLs based on screen size
      // On > 768px: replace h_315 with h_630 and w_400 with w_800
      if (window.innerWidth > 768) {
        content = content.map(item => {
          if (item.image) {
            item.image = item.image.replace(/h_315/g, 'h_630').replace(/w_400/g, 'w_800');
          }
          return item;
        });
        log('Updated RevContent image URLs for desktop (> 768px)');
      }
      
      log(`Fetched ${content.length} RevContent items`);
      return content;
    } catch (error) {
      if (error.message === 'RevContent API timeout') {
        log('RevContent API timeout - continuing without RevContent items');
      } else {
        log('RevContent API fetch failed:', error);
      }
      return [];
    }
  } catch (error) {
    log('RevContent API fetch failed:', error);
    return [];
  }
};

// Note: findBestPathMatch is no longer used with the new section-specific manifest architecture
// Keeping for backward compatibility but it's not called in the new flow