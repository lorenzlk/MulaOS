const axios = require('axios');
const xml2js = require('xml2js');
const path = require('path');

class SitemapCrawler {
  async crawl(domain, options = {}) {
    const maxUrls = options.maxUrls || 10000;
    const maxSitemaps = options.maxSitemaps || 15;
    
    console.log(`  📄 Fetching sitemap for ${domain}...`);
    
    const sitemapUrls = [
      `https://${domain}/sitemap.xml`,
      `https://${domain}/sitemap_index.xml`,
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
        
        if (sitemap.sitemapindex) {
          return await this.crawlIndex(sitemap.sitemapindex, maxUrls, maxSitemaps);
        } else if (sitemap.urlset) {
          return this.extractUrls(sitemap.urlset, maxUrls);
        }
      } catch (error) {
        continue;
      }
    }
    
    throw new Error('No sitemap found');
  }
  
  async crawlIndex(index, maxUrls, maxSitemaps) {
    const sitemaps = (index.sitemap || []).slice(0, maxSitemaps);
    console.log(`  📦 Found ${index.sitemap.length} sitemaps, analyzing first ${maxSitemaps}...`);
    
    let allUrls = [];
    
    for (const sm of sitemaps) {
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
        const urls = this.extractUrls(sitemap.urlset, maxUrls - allUrls.length);
        allUrls = allUrls.concat(urls);
        
        if (allUrls.length >= maxUrls) break;
      } catch (error) {
        continue;
      }
    }
    
    console.log(`  ✅ Crawled ${allUrls.length} URLs`);
    return allUrls;
  }
  
  extractUrls(urlset, maxUrls) {
    const urlElements = urlset?.url || [];
    const urls = urlElements
      .map(u => u.loc?.[0])
      .filter(Boolean)
      .slice(0, maxUrls);
    
    return urls;
  }
}

module.exports = SitemapCrawler;

