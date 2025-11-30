const axios = require('axios');
const cheerio = require('cheerio');

// Try multiple browser automation options
let puppeteer = null;
let playwright = null;

try {
  puppeteer = require('puppeteer');
} catch (e) {
  // Puppeteer optional
}

try {
  playwright = require('playwright');
} catch (e) {
  // Playwright optional
}

class SdkHealthCheck {
  async check(domain, options = {}) {
    const testUrl = options.testUrl || null;
    
    console.log(`  🏥 Checking Mula SDK deployment...`);
    console.log(`  ℹ️  Note: Mula SDK (SmartScroll) loads dynamically at bottom of page`);
    if (testUrl) {
      console.log(`  📍 Testing specific URL: ${testUrl}`);
    }
    
    const results = {
      sdk_present: false,
      sdk_version: null,
      cdn_url: null,
      load_time_ms: null,
      checked_pages: [],
      detection_method: null,
      deployment_date: null,
      errors: [],
      warnings: [],
      note: 'Mula SDK loads dynamically at bottom of page - may not appear in static HTML'
    };
    
    try {
      // Step 1: Check database first (if DATABASE_URL is available)
      // TODO: Uncomment when database access is granted
      /*
      if (process.env.DATABASE_URL) {
        const DatabaseHelper = require('../helpers/DatabaseHelper');
        const dbHelper = new DatabaseHelper();
        const dbResult = await dbHelper.checkDeployment(domain);
        
        if (dbResult.deployed) {
          results.sdk_present = true;
          results.detection_method = 'database';
          results.deployment_date = dbResult.deployment_date;
          results.slack_channel = dbResult.slack_channel;
          results.display_name = dbResult.display_name;
          
          console.log(`  ✅ SDK deployed (verified via database)`);
          console.log(`  📅 Deployment date: ${new Date(dbResult.deployment_date).toLocaleDateString()}`);
          console.log(`  💬 Slack channel: ${dbResult.slack_channel}`);
          
          await dbHelper.close();
          return results;
        }
        
        await dbHelper.close();
      }
      */
      
      // Step 2: Check pages directly (works without database)
      // NOTE: Mula SDK loads dynamically at bottom of page, so static HTML parsing may not detect it
      console.log(`  🔍 Checking website for SDK script tags (static HTML check)...`);
      console.log(`  ℹ️  SDK loads dynamically - may require scrolling to bottom to see in browser console`);
      
      // If specific URL provided, use it; otherwise try homepage
      let pageToCheck = testUrl || `https://${domain}`;
      if (testUrl) {
        console.log(`  📍 Using provided test URL for SDK check`);
      }
      
      const pageResponse = await axios.get(pageToCheck, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MulaBot/1.0)'
        }
      });
      const pageHtml = pageResponse.data;
      let $ = cheerio.load(pageHtml);
      results.checked_pages.push({ url: pageToCheck, type: 'homepage' });
      
      // Enhanced SDK detection - check multiple patterns
      let mulaScript = $('script[src*="makemula"]');  // Direct script tag
      
      // Also check for cdn.makemula.ai
      if (mulaScript.length === 0) {
        mulaScript = $('script[src*="cdn.makemula.ai"]');
      }
      
      // Check in script content (for inline scripts that load SDK)
      if (mulaScript.length === 0) {
        $('script').each((i, elem) => {
          const scriptContent = $(elem).html() || '';
          if (scriptContent.includes('makemula') || 
              scriptContent.includes('cdn.makemula.ai') ||
              scriptContent.includes('mula.init') ||
              scriptContent.includes('MulaSDK')) {
            mulaScript = $(elem);
            return false; // break
          }
        });
      }
      
      // Check for GTM dataLayer variables
      let gtmDetected = false;
      if (pageHtml.includes('googletagmanager.com/gtm.js') || 
          pageHtml.includes('GTM-') ||
          $('script[src*="googletagmanager.com"]').length > 0) {
        gtmDetected = true;
        results.gtm_detected = true;
        console.log(`  📊 GTM detected (SDK may be deployed via GTM)`);
        
        // Check dataLayer for Mula references
        if (pageHtml.includes('dataLayer') && 
            (pageHtml.includes('mula') || pageHtml.includes('Mula'))) {
          results.warnings.push('GTM detected with potential Mula references in dataLayer - SDK likely deployed via GTM');
          // If GTM is present and we can't find SDK in HTML, assume it might be deployed
          if (mulaScript.length === 0) {
            results.warnings.push('SDK not found in static HTML but GTM detected - SDK loads dynamically at bottom of page');
          }
        }
      }
      
      // Note about dynamic loading
      if (mulaScript.length === 0) {
        results.warnings.push('Mula SDK loads dynamically at bottom of page - scroll to bottom and check browser console for MulaSDK object');
      }
      
      // Step 3: If not found on homepage, check article pages
      if (mulaScript.length === 0) {
        console.log(`  📄 SDK not on homepage, checking article pages...`);
        
        // Try to get article URLs from RSS feed (most reliable for article discovery)
        const articleLinks = await this.getArticleUrlsFromRss(domain);
        
        // Fallback: Try to find article links from homepage
        if (articleLinks.length === 0) {
          $('a[href]').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href && !href.startsWith('#') && !href.startsWith('mailto:')) {
              // Look for full article URLs (with slugs, not just category pages)
              const pathSegments = href.split('/').filter(s => s && s.length > 0);
              
              // Must have at least 3 segments (e.g., /teams/ohio-state/news-article-title)
              if (pathSegments.length >= 3 && 
                  (href.match(/\/(news|article|story|post)-[\w-]+/i) ||
                  pathSegments[pathSegments.length - 1].length > 20)) {
                
                const fullUrl = href.startsWith('http') ? href : `https://${domain}${href}`;
                if (fullUrl.includes(domain) && !articleLinks.includes(fullUrl)) {
                  articleLinks.push(fullUrl);
                }
              }
            }
          });
        }
        
        // Try first 3 article links with enhanced detection
        for (const articleUrl of articleLinks.slice(0, 3)) {
          try {
            const articleResponse = await axios.get(articleUrl, {
              timeout: 15000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; MulaBot/1.0)'
              }
            });
            const articleHtml = articleResponse.data;
            $ = cheerio.load(articleHtml);
            results.checked_pages.push({ url: articleUrl, type: 'article' });
            
            // Enhanced SDK detection on article page
            mulaScript = $('script[src*="makemula"], script[src*="cdn.makemula.ai"]');
            
            // Check script content
            if (mulaScript.length === 0) {
              $('script').each((i, elem) => {
                const scriptContent = $(elem).html() || '';
                if (scriptContent.includes('makemula') || 
                    scriptContent.includes('cdn.makemula.ai') ||
                    scriptContent.includes('mula.init') ||
                    scriptContent.includes('MulaSDK')) {
                  mulaScript = $(elem);
                  return false;
                }
              });
            }
            
            if (mulaScript.length > 0) {
              console.log(`  ✅ SDK found on article page`);
              pageToCheck = articleUrl;
              break;
            }
          } catch (error) {
            continue;
          }
        }
      }
      
      // Step 4: If not found in static HTML, try browser automation (Playwright preferred, Puppeteer fallback)
      // Always try if specific URL provided (user wants to test that page)
      if ((mulaScript.length === 0 || testUrl) && (playwright || puppeteer)) {
        if (testUrl) {
          console.log(`  📌 Testing specific URL provided by user`);
          pageToCheck = testUrl;
        }
        
        // Try Playwright first (more reliable on macOS)
        if (playwright) {
          console.log(`  🎭 Trying Playwright to detect dynamically loaded SDK...`);
          console.log(`  📍 Checking: ${pageToCheck}`);
          try {
            const dynamicResult = await this.checkWithPlaywright(pageToCheck);
            console.log(`  📊 Playwright result: SDK present = ${dynamicResult.sdk_present}, method = ${dynamicResult.detection_method}`);
            if (dynamicResult.sdk_present) {
              results.sdk_present = true;
              results.detection_method = 'playwright_dynamic';
              results.cdn_url = dynamicResult.cdn_url;
              results.sdk_version = dynamicResult.sdk_version;
              results.load_time_ms = dynamicResult.load_time_ms;
              if (dynamicResult.detection_details) {
                results.detection_details = dynamicResult.detection_details;
              }
              console.log(`  ✅ SDK detected via Playwright (dynamic loading)`);
              return results;
            } else {
              console.log(`  ⚠️  Playwright did not detect SDK (method: ${dynamicResult.detection_method || 'not_found'})`);
              if (dynamicResult.network_requests && dynamicResult.network_requests.length > 0) {
                console.log(`  📡 Network requests checked: ${dynamicResult.network_requests.join(', ')}`);
              }
            }
          } catch (playwrightError) {
            console.log(`  ⚠️  Playwright check failed: ${playwrightError.message}`);
            // Fall through to try Puppeteer if available
          }
        }
        
        // Fallback to Puppeteer if Playwright failed or not available
        if (!results.sdk_present && puppeteer) {
          console.log(`  🤖 Trying Puppeteer to detect dynamically loaded SDK...`);
          console.log(`  📍 Checking: ${pageToCheck}`);
          try {
            const dynamicResult = await this.checkWithPuppeteer(pageToCheck);
            console.log(`  📊 Puppeteer result: SDK present = ${dynamicResult.sdk_present}, method = ${dynamicResult.detection_method}`);
            if (dynamicResult.sdk_present) {
              results.sdk_present = true;
              results.detection_method = 'puppeteer_dynamic';
              results.cdn_url = dynamicResult.cdn_url;
              results.sdk_version = dynamicResult.sdk_version;
              results.load_time_ms = dynamicResult.load_time_ms;
              if (dynamicResult.detection_details) {
                results.detection_details = dynamicResult.detection_details;
              }
              console.log(`  ✅ SDK detected via Puppeteer (dynamic loading)`);
              return results;
            } else {
              console.log(`  ⚠️  Puppeteer did not detect SDK (method: ${dynamicResult.detection_method || 'not_found'})`);
              if (dynamicResult.network_requests && dynamicResult.network_requests.length > 0) {
                console.log(`  📡 Network requests checked: ${dynamicResult.network_requests.join(', ')}`);
              }
            }
          } catch (puppeteerError) {
            console.log(`  ⚠️  Puppeteer check failed: ${puppeteerError.message}`);
            // Add helpful note about browser automation failure
            if (puppeteerError.message.includes('Failed to launch')) {
              results.warnings.push('Browser automation failed - dynamic SDK detection unavailable. SDK may still be deployed via GTM.');
              results.warnings.push('To verify SDK: Open page in browser, scroll to bottom, check DevTools Console for MulaSDK object or Network tab for cdn.makemula.ai requests');
            } else {
              results.warnings.push(`Browser automation failed: ${puppeteerError.message}`);
            }
          }
        }
      } else if (mulaScript.length === 0 && !playwright && !puppeteer) {
        console.log(`  ℹ️  No browser automation available (Playwright/Puppeteer) - skipping dynamic detection`);
      }
      
      // Step 5: Analyze SDK detection results
      if (mulaScript.length === 0) {
        // If GTM is detected, provide more helpful guidance
        if (gtmDetected) {
          results.sdk_present = false;
          results.detection_method = 'gtm_suspected';
          results.warnings.push('SDK not found in static HTML but GTM detected - SDK is likely deployed via GTM');
          if (!puppeteer) {
            results.warnings.push('Mula SDK loads dynamically at bottom of page - scroll to bottom and check browser console (F12 → Console → type "MulaSDK")');
          }
          results.warnings.push('To verify: Check GTM container for Mula SDK tag, or scroll to bottom of page and check browser console');
          console.log(`  ⚠️  SDK not detected in static HTML, but GTM detected - likely deployed via GTM`);
          console.log(`  ℹ️  SDK loads at bottom of page - requires scrolling to see in console`);
        } else {
          results.sdk_present = false;
          results.detection_method = 'not_found';
          results.errors.push('Mula SDK script tag not found in static HTML');
          if (!puppeteer) {
            results.warnings.push('Mula SDK loads dynamically at bottom of page - scroll to bottom and check browser console');
          }
          results.warnings.push('SDK might be deployed via GTM or direct script tag - static HTML parsing cannot detect dynamic loading');
          console.log(`  ❌ SDK not detected in static HTML on ${domain}`);
          console.log(`  ℹ️  SDK loads at bottom of page - verify by scrolling to bottom and checking browser console`);
        }
        return results;
      }
      
      // SDK found!
      results.sdk_present = true;
      results.detection_method = mulaScript.attr('src') ? 'script_tag' : 'inline_script';
      const scriptSrc = mulaScript.attr('src');
      if (scriptSrc) {
        results.cdn_url = scriptSrc;
        console.log(`  ✅ SDK detected: ${scriptSrc}`);
      } else {
        console.log(`  ✅ SDK detected in inline script`);
      }
      
      // Step 5: Verify SDK loads from CDN (if script tag with src)
      if (scriptSrc) {
        const cdnStart = Date.now();
        try {
          const cdnResponse = await axios.get(scriptSrc, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MulaBot/1.0)'
          }
        });
        results.load_time_ms = Date.now() - cdnStart;
        
        // Check for version in script content
        const scriptContent = cdnResponse.data;
        const versionMatch = scriptContent.match(/version["\s:]+["']?([0-9.]+)["']?/i);
        if (versionMatch) {
          results.sdk_version = versionMatch[1];
        }
        
        console.log(`  ✅ SDK loads successfully (${results.load_time_ms}ms)`);
        
        if (results.load_time_ms > 2000) {
          results.warnings.push(`Slow SDK load time: ${results.load_time_ms}ms (expected <1000ms)`);
        }
        
        } catch (cdnError) {
          results.errors.push(`SDK script tag present but fails to load: ${cdnError.message}`);
          console.log(`  ⚠️  SDK script tag present but fails to load`);
        }
      }
      
      // Step 6: Check for multiple SDK instances (common mistake)
      if (mulaScript.length > 1) {
        results.warnings.push(`Multiple SDK script tags detected (${mulaScript.length}). This may cause conflicts.`);
      }
      
      // Step 7: Check for GTM container (already checked above, but verify)
      if (!results.gtm_detected) {
        const gtmScript = $('script[src*="googletagmanager.com"]');
        if (gtmScript.length > 0) {
          results.gtm_detected = true;
          console.log(`  📊 GTM detected (SDK may be deployed via GTM)`);
        }
      }
      
    } catch (error) {
      results.errors.push(`Failed to analyze site: ${error.message}`);
      console.log(`  ❌ Failed to check ${domain}: ${error.message}`);
    }
    
    return results;
  }
  
  async loadPage(url) {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MulaBot/1.0)'
      }
    });
    const cheerio = require('cheerio');
    return cheerio.load(response.data);
  }
  
  async getArticleUrlsFromRss(domain) {
    const rssUrls = [
      `https://${domain}/feed`,
      `https://${domain}/rss`,
      `https://${domain}/feed.xml`,
      `https://www.${domain}/feed`,
    ];
    
    for (const url of rssUrls) {
      try {
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MulaBot/1.0)'
          }
        });
        
        const xml2js = require('xml2js');
        const feed = await xml2js.parseStringPromise(response.data);
        const items = feed?.rss?.channel?.[0]?.item || [];
        
        const articleUrls = [];
        for (const item of items.slice(0, 5)) {  // Get first 5 articles
          const link = item.link?.[0];
          if (link) {
            articleUrls.push(link);
          }
        }
        
        return articleUrls;
      } catch (error) {
        continue;
      }
    }
    
    return [];
  }
  
  async checkWithPlaywright(url) {
    if (!playwright) {
      throw new Error('Playwright not available');
    }
    
    console.log(`  🎭 Using Playwright for dynamic SDK detection...`);
    
    const browser = await playwright.chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
      const page = await context.newPage();
      
      // Track network requests
      const sdkRequests = [];
      const requestUrls = new Set();
      
      page.on('request', (request) => {
        const requestUrl = request.url();
        if (requestUrl.includes('makemula') || requestUrl.includes('cdn.makemula.ai')) {
          if (!requestUrls.has(requestUrl)) {
            requestUrls.add(requestUrl);
            sdkRequests.push({ url: requestUrl, type: 'request' });
            console.log(`  📡 SDK network request detected: ${requestUrl}`);
          }
        }
      });
      
      page.on('response', (response) => {
        const responseUrl = response.url();
        if (responseUrl.includes('makemula') || responseUrl.includes('cdn.makemula.ai')) {
          if (!requestUrls.has(responseUrl)) {
            requestUrls.add(responseUrl);
            sdkRequests.push({ url: responseUrl, type: 'response', status: response.status() });
            console.log(`  📡 SDK network response detected: ${responseUrl} (${response.status()})`);
          }
        }
      });
      
      // Navigate to page
      console.log(`  🌐 Navigating to: ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      // Scroll to bottom multiple times
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);
      }
      
      // Wait for SDK
      await page.waitForTimeout(3000);
      
      // Check for SDK
      const sdkDetected = await page.evaluate(() => {
        const results = { found: false, method: null, details: {} };
        
        if (window.MulaSDK) {
          results.found = true;
          results.method = 'window.MulaSDK';
          results.details.version = window.MulaSDK.version || null;
          return results;
        }
        
        const scripts = Array.from(document.querySelectorAll('script'));
        const mulaScripts = scripts.filter(s => 
          s.src && (s.src.includes('makemula') || s.src.includes('cdn.makemula.ai'))
        );
        
        if (mulaScripts.length > 0) {
          results.found = true;
          results.method = 'script_tag';
          results.details.src = mulaScripts[0].src;
          results.details.count = mulaScripts.length;
          results.details.all_srcs = mulaScripts.map(s => s.src);
          return results;
        }
        
        // Check for inline scripts
        const inlineScripts = scripts.filter(s => {
          const content = (s.textContent || s.innerHTML || '').toLowerCase();
          return content.includes('makemula') || content.includes('mulasdk');
        });
        
        if (inlineScripts.length > 0) {
          results.found = true;
          results.method = 'inline_script';
          results.details.count = inlineScripts.length;
          return results;
        }
        
        // Check for DOM elements
        const mulaElements = document.querySelectorAll('[id*="mula"], [class*="mula"], [data-mula]');
        if (mulaElements.length > 0) {
          results.found = true;
          results.method = 'dom_elements';
          results.details.count = mulaElements.length;
          return results;
        }
        
        return results;
      });
      
      // Check network requests
      if (sdkRequests.length > 0 && !sdkDetected.found) {
        sdkDetected.found = true;
        sdkDetected.method = 'network_request';
        sdkDetected.details = { requests: sdkRequests.map(r => r.url) };
      }
      
      if (sdkDetected.found) {
        const scriptSrc = sdkDetected.details?.src || sdkDetected.details?.requests?.[0] || null;
        return {
          sdk_present: true,
          detection_method: 'playwright_dynamic',
          cdn_url: scriptSrc,
          sdk_version: sdkDetected.details?.version || null,
          load_time_ms: null,
          detection_details: sdkDetected.details || {}
        };
      }
      
      return {
        sdk_present: false,
        detection_method: 'playwright_not_found',
        network_requests: sdkRequests.map(r => r.url)
      };
      
    } finally {
      await browser.close();
    }
  }
  
  async checkWithPuppeteer(url) {
    if (!puppeteer) {
      throw new Error('Puppeteer not available');
    }
    
    // Try to launch browser with new headless mode first, fallback to old if needed
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new', // Use new headless mode
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ],
        timeout: 30000
      });
    } catch (error) {
      // Fallback to old headless mode
      console.log(`  ⚠️  New headless mode failed, trying old mode: ${error.message}`);
      try {
        browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
          ],
          timeout: 30000
        });
      } catch (fallbackError) {
        throw new Error(`Failed to launch browser: ${fallbackError.message}. Puppeteer may need Chromium installed.`);
      }
    }
    
    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Track network requests for SDK (set up BEFORE navigation)
      const sdkRequests = [];
      const requestUrls = new Set();
      
      page.on('request', (request) => {
        const requestUrl = request.url();
        if (requestUrl.includes('makemula') || requestUrl.includes('cdn.makemula.ai')) {
          if (!requestUrls.has(requestUrl)) {
            requestUrls.add(requestUrl);
            sdkRequests.push({
              url: requestUrl,
              type: 'request',
              resourceType: request.resourceType()
            });
            console.log(`  📡 SDK network request detected: ${requestUrl}`);
          }
        }
      });
      
      page.on('response', (response) => {
        const responseUrl = response.url();
        if (responseUrl.includes('makemula') || responseUrl.includes('cdn.makemula.ai')) {
          if (!requestUrls.has(responseUrl)) {
            requestUrls.add(responseUrl);
            sdkRequests.push({
              url: responseUrl,
              type: 'response',
              status: response.status(),
              headers: response.headers()
            });
            console.log(`  📡 SDK network response detected: ${responseUrl} (${response.status()})`);
          }
        }
      });
      
      // Navigate to page
      console.log(`  🌐 Navigating to: ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Wait for network to be idle
      try {
        await page.waitForLoadState?.('networkidle') || await page.waitForTimeout(3000);
      } catch (e) {
        await page.waitForTimeout(3000);
      }
      
      // Check for SDK in initial load
      let initialCheck = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script'));
        return scripts.filter(s => s.src && (s.src.includes('makemula') || s.src.includes('cdn.makemula.ai')));
      });
      
      if (initialCheck.length > 0) {
        console.log(`  ✅ SDK script tag found in initial load: ${initialCheck[0].src}`);
      }
      
      // Scroll to bottom multiple times to trigger lazy loading
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await page.waitForTimeout(2000);
        
        // Check if page height changed (more content loaded)
        const newHeight = await page.evaluate(() => document.body.scrollHeight);
        if (i === 0) {
          console.log(`  📏 Initial page height: ${newHeight}px`);
        }
      }
      
      // Wait for any pending network requests
      await page.waitForTimeout(3000);
      
      // Try waiting for SDK script to appear
      try {
        await page.waitForFunction(() => {
          const scripts = Array.from(document.querySelectorAll('script'));
          return scripts.some(s => s.src && (s.src.includes('makemula') || s.src.includes('cdn.makemula.ai')));
        }, { timeout: 10000 });
        console.log(`  ✅ SDK script tag appeared after waiting`);
      } catch (e) {
        console.log(`  ⏱️  SDK script tag wait timeout (may already be loaded)`);
      }
      
      // Wait for SDK to initialize
      await page.waitForTimeout(3000);
      
      // Check for MulaSDK in window object and DOM
      const sdkDetected = await page.evaluate(() => {
        const results = {
          found: false,
          method: null,
          details: {}
        };
        
        // Check for MulaSDK global object
        if (window.MulaSDK) {
          results.found = true;
          results.method = 'window.MulaSDK';
          results.details.version = window.MulaSDK.version || null;
          results.details.initialized = typeof window.MulaSDK.init === 'function';
          results.details.properties = Object.keys(window.MulaSDK);
          return results;
        }
        
        // Check for script tags with makemula (check all scripts, including dynamically added)
        const scripts = Array.from(document.querySelectorAll('script'));
        const mulaScripts = scripts.filter(s => {
          if (!s.src) return false;
          const src = s.src.toLowerCase();
          return src.includes('makemula') || src.includes('cdn.makemula.ai');
        });
        
        if (mulaScripts.length > 0) {
          results.found = true;
          results.method = 'script_tag';
          results.details.src = mulaScripts[0].src;
          results.details.count = mulaScripts.length;
          results.details.all_srcs = mulaScripts.map(s => s.src);
          results.details.script_ids = mulaScripts.map(s => s.id).filter(Boolean);
          return results;
        }
        
        // Check for inline scripts with Mula references
        const inlineScripts = scripts.filter(s => {
          const content = (s.textContent || s.innerHTML || '').toLowerCase();
          return content.includes('makemula') || content.includes('mulasdk') || content.includes('cdn.makemula.ai');
        });
        
        if (inlineScripts.length > 0) {
          results.found = true;
          results.method = 'inline_script';
          results.details.count = inlineScripts.length;
          results.details.sample_content = inlineScripts[0].textContent.substring(0, 200);
          return results;
        }
        
        // Check for Mula-related elements (SmartScroll container)
        const mulaElements = document.querySelectorAll('[id*="mula"], [class*="mula"], [data-mula], [id*="smartscroll"], [class*="smartscroll"], [id*="mula-smartscroll"], [data-mula-id]');
        if (mulaElements.length > 0) {
          results.found = true;
          results.method = 'dom_elements';
          results.details.count = mulaElements.length;
          results.details.ids = Array.from(mulaElements).map(el => el.id).filter(Boolean);
          results.details.classes = Array.from(mulaElements).map(el => el.className).filter(Boolean);
          return results;
        }
        
        // Check if SDK script is in the page HTML (even if not executed yet)
        const pageSource = document.documentElement.outerHTML.toLowerCase();
        if (pageSource.includes('makemula') || pageSource.includes('cdn.makemula.ai')) {
          results.found = true;
          results.method = 'page_source';
          results.details.note = 'SDK reference found in page source';
          // Try to extract the URL
          const urlMatch = pageSource.match(/https?:\/\/[^\s"']*makemula[^\s"']*/i);
          if (urlMatch) {
            results.details.found_url = urlMatch[0];
          }
          return results;
        }
        
        // Check window object for any Mula-related properties
        const windowKeys = Object.keys(window).filter(k => k.toLowerCase().includes('mula'));
        if (windowKeys.length > 0) {
          results.found = true;
          results.method = 'window_properties';
          results.details.properties = windowKeys;
          return results;
        }
        
        return results;
      });
      
      // Network requests are the most reliable indicator - check them
      if (sdkRequests.length > 0) {
        console.log(`  📡 Found ${sdkRequests.length} SDK network request(s)`);
        if (!sdkDetected.found) {
          sdkDetected.found = true;
          sdkDetected.method = 'network_request';
          sdkDetected.details = {
            requests: sdkRequests.map(r => ({ 
              url: r.url, 
              type: r.type,
              status: r.status || 'pending',
              resourceType: r.resourceType
            }))
          };
        } else {
          // Add network requests to existing detection
          sdkDetected.details.network_requests = sdkRequests.map(r => r.url);
        }
      }
      
      if (sdkDetected.found) {
        const scriptSrc = sdkDetected.details?.src || sdkDetected.details?.requests?.[0]?.url || null;
        const version = sdkDetected.details?.version || null;
        
        console.log(`  ✅ Puppeteer detected SDK via: ${sdkDetected.method}`);
        if (sdkDetected.details) {
          if (sdkDetected.details.count) {
            console.log(`  📊 Found ${sdkDetected.details.count} Mula-related DOM elements`);
          }
          if (sdkDetected.details.requests) {
            console.log(`  📡 Found ${sdkDetected.details.requests.length} SDK network request(s)`);
          }
          if (sdkDetected.details.all_srcs) {
            console.log(`  📜 Found ${sdkDetected.details.all_srcs.length} SDK script tag(s)`);
          }
        }
        
        return {
          sdk_present: true,
          detection_method: 'puppeteer_dynamic',
          cdn_url: scriptSrc,
          sdk_version: version,
          load_time_ms: null,
          detection_details: sdkDetected.details || {}
        };
      } else {
        console.log(`  ❌ Puppeteer did not find SDK after scrolling to bottom`);
        console.log(`  📋 Network requests checked: ${sdkRequests.length > 0 ? sdkRequests.map(r => r.url).join(', ') : 'none'}`);
        return {
          sdk_present: false,
          detection_method: 'puppeteer_not_found',
          network_requests: sdkRequests.length > 0 ? sdkRequests.map(r => r.url) : []
        };
      }
      
    } finally {
      await browser.close();
    }
  }
  
  generateStatus(results) {
    if (!results.sdk_present) {
      return '❌ NOT DEPLOYED';
    }
    
    if (results.errors.length > 1) {
      return '⚠️ DEPLOYED WITH ERRORS';
    }
    
    if (results.warnings.length > 0) {
      return '🟡 DEPLOYED WITH WARNINGS';
    }
    
    return '✅ HEALTHY';
  }
}

module.exports = SdkHealthCheck;

