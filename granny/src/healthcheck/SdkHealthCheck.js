const axios = require('axios');
const cheerio = require('cheerio');

class SdkHealthCheck {
  async check(domain) {
    console.log(`  🏥 Checking Mula SDK deployment...`);
    
    const results = {
      sdk_present: false,
      sdk_version: null,
      cdn_url: null,
      load_time_ms: null,
      checked_pages: [],
      detection_method: null,
      deployment_date: null,
      errors: [],
      warnings: []
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
      console.log(`  🔍 Checking website for SDK script tags...`);
      
      // Try homepage first (quick check)
      let pageToCheck = `https://${domain}`;
      let $ = await this.loadPage(pageToCheck);
      results.checked_pages.push({ url: pageToCheck, type: 'homepage' });
      
      let mulaScript = $('script[src*="makemula"]');  // Simplified: just look for "makemula" anywhere
      
      // Step 2: If not on homepage, try to find an article page
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
              // Article URLs typically have multiple path segments and contain words
              const pathSegments = href.split('/').filter(s => s && s.length > 0);
              
              // Must have at least 3 segments (e.g., /teams/ohio-state/news-article-title)
              // And contain article-like keywords
              if (pathSegments.length >= 3 && 
                  href.match(/\/(news|article|story|post)-[\w-]+/i) ||
                  (pathSegments.length >= 3 && pathSegments[pathSegments.length - 1].length > 20)) {
                
                const fullUrl = href.startsWith('http') ? href : `https://${domain}${href}`;
                if (fullUrl.includes(domain) && !articleLinks.includes(fullUrl)) {
                  articleLinks.push(fullUrl);
                }
              }
            }
          });
        }
        
        // Try first 3 article links
        for (const articleUrl of articleLinks.slice(0, 3)) {
          try {
            $ = await this.loadPage(articleUrl);
            mulaScript = $('script[src*="makemula"]');  // Simplified search
            results.checked_pages.push({ url: articleUrl, type: 'article' });
            
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
      
      // Step 3: Analyze SDK if found
      if (mulaScript.length === 0) {
        results.sdk_present = false;
        results.detection_method = 'not_found';
        results.errors.push('Mula SDK script tag not found on homepage or article pages');
        results.warnings.push('SDK might be deployed via GTM (dynamic loading) - not detectable with static HTML parsing');
        console.log(`  ❌ SDK not detected on ${domain}`);
        return results;
      }
      
      // SDK found via script tag!
      results.sdk_present = true;
      results.detection_method = 'script_tag';
      const scriptSrc = mulaScript.attr('src');
      results.cdn_url = scriptSrc;
      
      console.log(`  ✅ SDK detected: ${scriptSrc}`);
      
      // Step 4: Verify SDK loads from CDN
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
      
      // Step 5: Check for multiple SDK instances (common mistake)
      if (mulaScript.length > 1) {
        results.warnings.push(`Multiple SDK script tags detected (${mulaScript.length}). This may cause conflicts.`);
      }
      
      // Step 6: Check for GTM container (if present)
      const gtmScript = $('script[src*="googletagmanager.com/gtm.js"]');
      if (gtmScript.length > 0) {
        results.gtm_detected = true;
        console.log(`  📊 GTM detected (SDK may be deployed via GTM)`);
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

