const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

class NavigationScraper {
  async scrape(domain) {
    console.log(`  🧭 Analyzing navigation...`);
    
    try {
      const response = await axios.get(`https://${domain}`, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MulaBot/1.0)'
        }
      });
      
      const $ = cheerio.load(response.data);
      const sportKeywords = require(path.join(__dirname, '../../data/sport-keywords.json'));
      
      // Find navigation elements
      const navElements = $('nav, header, .menu, .navigation, [role="navigation"]');
      
      const categories = [];
      
      navElements.find('a').each((i, elem) => {
        const href = $(elem).attr('href');
        const text = $(elem).text().trim().toLowerCase();
        
        if (!href) return;
        
        const category = this.extractCategory(href, text, sportKeywords);
        
        if (category !== 'other') {
          categories.push({
            category: category,
            url: href,
            text: text
          });
        }
      });
      
      console.log(`  ✅ Found ${categories.length} sport-related nav items`);
      
      // Count by category
      const distribution = {};
      
      for (const cat of categories) {
        if (!distribution[cat.category]) {
          distribution[cat.category] = {
            count: 0,
            nav_items: []
          };
        }
        distribution[cat.category].count++;
        distribution[cat.category].nav_items.push(cat.text);
      }
      
      // Convert to percentages (nav presence = priority)
      const total = categories.length;
      
      for (const [category, data] of Object.entries(distribution)) {
        data.percentage = Math.round((data.count / total) * 100);
      }
      
      return {
        source: 'navigation',
        total_items: total,
        distribution: distribution,
        confidence: 55 // Nav is decent signal
      };
      
    } catch (error) {
      return null;
    }
  }
  
  extractCategory(href, text, sportKeywords) {
    const combined = `${href} ${text}`.toLowerCase();
    
    for (const [sport, keywords] of Object.entries(sportKeywords)) {
      for (const keyword of keywords) {
        if (combined.includes(keyword)) {
          return sport;
        }
      }
    }
    
    return 'other';
  }
}

module.exports = NavigationScraper;

