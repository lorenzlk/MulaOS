const path = require('path');

class TrafficEstimator {
  constructor() {
    this.industryBenchmarks = require(path.join(__dirname, '../../data/industry-benchmarks.json'));
  }
  
  estimate(scrapedData) {
    // Combine multiple data sources with weighted average
    const sources = [];
    
    if (scrapedData.sitemap) {
      sources.push({
        data: scrapedData.sitemap,
        weight: 0.40 // Sitemap is best signal
      });
    }
    
    if (scrapedData.rss) {
      sources.push({
        data: scrapedData.rss,
        weight: 0.35 // RSS is good signal
      });
    }
    
    if (scrapedData.navigation) {
      sources.push({
        data: scrapedData.navigation,
        weight: 0.25 // Nav is decent signal
      });
    }
    
    // If no data, use industry benchmarks
    if (sources.length === 0) {
      return this.useBenchmarks();
    }
    
    // Weighted average
    const combined = this.combineDistributions(sources);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(sources);
    
    return {
      estimated_distribution: combined,
      confidence: confidence,
      sources_used: sources.map(s => s.data.source),
      recommendation: this.generateRecommendation(combined, confidence)
    };
  }
  
  combineDistributions(sources) {
    const combined = {};
    
    // Get all unique categories
    const allCategories = new Set();
    for (const source of sources) {
      for (const category of Object.keys(source.data.distribution)) {
        allCategories.add(category);
      }
    }
    
    // Calculate weighted average for each category
    for (const category of allCategories) {
      let weightedSum = 0;
      let totalWeight = 0;
      
      for (const source of sources) {
        const dist = source.data.distribution[category];
        if (dist) {
          weightedSum += dist.percentage * source.weight;
          totalWeight += source.weight;
        }
      }
      
      combined[category] = {
        percentage: Math.round(weightedSum / totalWeight),
        rank: 0 // Will be set later
      };
    }
    
    // Rank categories
    const sorted = Object.entries(combined)
      .sort((a, b) => b[1].percentage - a[1].percentage);
    
    for (let i = 0; i < sorted.length; i++) {
      sorted[i][1].rank = i + 1;
    }
    
    return Object.fromEntries(sorted);
  }
  
  calculateConfidence(sources) {
    // Average confidence of all sources
    const avgConfidence = sources.reduce((sum, s) => sum + s.data.confidence, 0) / sources.length;
    
    // Boost if multiple sources agree
    const agreementBoost = sources.length > 1 ? 10 : 0;
    
    return Math.min(Math.round(avgConfidence + agreementBoost), 100);
  }
  
  useBenchmarks() {
    return {
      estimated_distribution: this.industryBenchmarks.multi_sport,
      confidence: 40,
      sources_used: ['industry_benchmarks'],
      recommendation: {
        priority_1: 'nfl',
        priority_2: 'nba',
        priority_3: 'cfb',
        note: 'Using industry benchmarks only. Get actual data for better estimates.'
      }
    };
  }
  
  generateRecommendation(distribution, confidence) {
    const sorted = Object.entries(distribution)
      .sort((a, b) => b[1].percentage - a[1].percentage);
    
    return {
      priority_1: sorted[0]?.[0] || 'Unknown',
      priority_2: sorted[1]?.[0] || 'Unknown',
      priority_3: sorted[2]?.[0] || 'Unknown',
      recommendation: confidence > 60 
        ? 'Confidence is good. Use these priorities for deployment.'
        : 'Confidence is low. Consider requesting Google Analytics access for accuracy.'
    };
  }
}

module.exports = TrafficEstimator;

