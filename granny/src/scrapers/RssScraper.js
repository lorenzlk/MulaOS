const axios = require('axios');
const xml2js = require('xml2js');
const path = require('path');

class RssScraper {
  async scrape(domain) {
    console.log(`  📡 Trying RSS feed...`);
    
    const rssUrls = [
      `https://${domain}/feed`,
      `https://${domain}/rss`,
      `https://${domain}/feed.xml`,
      `https://${domain}/rss.xml`,
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
        const feed = await xml2js.parseStringPromise(response.data);
        return this.analyzeFeed(feed);
      } catch (error) {
        // Try next URL
        continue;
      }
    }
    
    return null;
  }
  
  analyzeFeed(feed) {
    const items = feed?.rss?.channel?.[0]?.item || [];
    console.log(`  ✅ Found ${items.length} items in RSS feed`);
    
    const sportKeywords = require(path.join(__dirname, '../../data/sport-keywords.json'));
    const urlsByCategory = {};
    
    for (const item of items) {
      const link = item.link?.[0];
      if (!link) continue;
      
      const category = this.extractCategory(link, sportKeywords);
      
      if (!urlsByCategory[category]) {
        urlsByCategory[category] = [];
      }
      urlsByCategory[category].push(link);
    }
    
    // Calculate percentages
    const total = items.length;
    const distribution = {};
    
    for (const [category, urls] of Object.entries(urlsByCategory)) {
      distribution[category] = {
        count: urls.length,
        percentage: Math.round((urls.length / total) * 100),
        sample_urls: urls.slice(0, 3)
      };
    }
    
    return {
      source: 'rss',
      total_items: total,
      distribution: distribution,
      confidence: 70 // RSS is good signal
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

module.exports = RssScraper;

