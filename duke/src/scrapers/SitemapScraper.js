const axios = require('axios');
const xml2js = require('xml2js');
const path = require('path');

class SitemapScraper {
  async scrape(domain) {
    console.log(`  📄 Trying sitemap.xml...`);
    
    const sitemapUrls = [
      `https://${domain}/sitemap.xml`,
      `https://${domain}/sitemap_index.xml`,
      `https://${domain}/sitemap-index.xml`,
      `https://www.${domain}/sitemap.xml`,
    ];
    
    for (const url of sitemapUrls) {
      try {
        const response = await axios.get(url, { 
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MulaBot/1.0)'
          }
        });
        
        const sitemap = await xml2js.parseStringPromise(response.data);
        
        // Check if it's an index (points to other sitemaps)
        if (sitemap.sitemapindex) {
          return await this.parseIndex(sitemap.sitemapindex);
        } else if (sitemap.urlset) {
          return this.parseUrlSet(sitemap.urlset);
        }
      } catch (error) {
        // Try next URL
        continue;
      }
    }
    
    return null;
  }
  
  async parseIndex(index) {
    const sitemaps = index.sitemap || [];
    
    let allUrls = [];
    
    // Fetch first 10 sitemaps (don't overload)
    console.log(`  📦 Found sitemap index with ${sitemaps.length} sitemaps, analyzing first 10...`);
    
    for (const sm of sitemaps.slice(0, 10)) {
      const loc = sm.loc?.[0];
      if (!loc) continue;
      
      try {
        const response = await axios.get(loc, { 
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MulaBot/1.0)'
          }
        });
        const sitemap = await xml2js.parseStringPromise(response.data);
        const urls = this.extractUrls(sitemap.urlset);
        allUrls = allUrls.concat(urls);
        
        // Sample only (don't fetch all URLs)
        if (allUrls.length > 5000) break;
      } catch (error) {
        // Skip failed sitemaps
        continue;
      }
    }
    
    console.log(`  ✅ Analyzed ${allUrls.length} URLs from sitemap`);
    return this.analyzeUrls(allUrls);
  }
  
  parseUrlSet(urlset) {
    const urls = this.extractUrls(urlset);
    console.log(`  ✅ Found ${urls.length} URLs in sitemap`);
    return this.analyzeUrls(urls);
  }
  
  extractUrls(urlset) {
    const urlElements = urlset?.url || [];
    return urlElements.map(u => u.loc?.[0]).filter(Boolean);
  }
  
  analyzeUrls(urls) {
    const sportKeywords = require(path.join(__dirname, '../../data/sport-keywords.json'));
    const urlsByCategory = {};
    
    for (const url of urls) {
      const category = this.extractCategory(url, sportKeywords);
      
      if (!urlsByCategory[category]) {
        urlsByCategory[category] = [];
      }
      urlsByCategory[category].push(url);
    }
    
    const total = urls.length;
    const distribution = {};
    
    for (const [category, catUrls] of Object.entries(urlsByCategory)) {
      distribution[category] = {
        count: catUrls.length,
        percentage: Math.round((catUrls.length / total) * 100),
        sample_urls: catUrls.slice(0, 3)
      };
    }
    
    return {
      source: 'sitemap',
      total_urls: total,
      distribution: distribution,
      confidence: 75 // Sitemap is best free signal
    };
  }
  
  extractCategory(url, sportKeywords) {
    const lowerUrl = url.toLowerCase();
    
    for (const [sport, keywords] of Object.entries(sportKeywords)) {
      for (const keyword of keywords) {
        if (lowerUrl.includes(keyword)) {
          return sport;
        }
      }
    }
    
    return 'other';
  }
}

module.exports = SitemapScraper;

