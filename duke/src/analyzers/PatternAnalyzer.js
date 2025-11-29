const path = require('path');

class PatternAnalyzer {
  analyze(urls, options = {}) {
    const sportKeywords = require(path.join(__dirname, '../../data/sport-keywords.json'));
    
    console.log(`  🔍 Analyzing URL patterns...`);
    
    // Group URLs by sport/category
    const urlsBySport = this.groupBySport(urls, sportKeywords);
    
    // Analyze patterns for each sport
    const patterns = {};
    
    for (const [sport, sportUrls] of Object.entries(urlsBySport)) {
      if (sportUrls.length < 1) {
        // Skip sports with no URLs
        continue;
      }
      
      const pattern = this.findPattern(sportUrls);
      
      if (pattern) {
        patterns[sport] = {
          pattern: pattern.pattern,
          confidence: pattern.confidence,
          url_count: sportUrls.length,
          sample_urls: sportUrls.slice(0, 5),
          variations: pattern.variations
        };
      }
    }
    
    // NEW: Try to discover patterns by URL structure analysis
    if (Object.keys(patterns).length === 0 && urls.length > 10) {
      console.log(`  🔄 No sport-specific patterns found, trying structural analysis...`);
      const structuralPatterns = this.findStructuralPatterns(urls, sportKeywords);
      Object.assign(patterns, structuralPatterns);
    }
    
    console.log(`  ✅ Found patterns for ${Object.keys(patterns).length} sports`);
    
    return patterns;
  }
  
  // NEW: Find patterns by analyzing URL structure, not just sport keywords
  findStructuralPatterns(urls, sportKeywords) {
    const patterns = {};
    
    // Look for common path structures
    // e.g., /category/subcategory/*, /year/month/*, /section/*
    const pathStructures = {};
    
    for (const url of urls) {
      try {
        const urlObj = new URL(url);
        const segments = urlObj.pathname.split('/').filter(s => s && s.length > 0);
        
        if (segments.length === 0) continue;
        
        // Skip obvious non-article patterns
        if (segments[0] === 'tag' || segments[0] === 'page' || segments[0] === 'wp-admin') continue;
        
        // Extract first 1-2 segments as potential category
        const category = segments[0];
        const subcategory = segments.length > 1 ? segments[1] : null;
        
        // Check if this category might be sports-related
        const sport = this.detectSportInSegment(category, sportKeywords);
        
        if (sport && sport !== 'other') {
          if (!pathStructures[sport]) {
            pathStructures[sport] = [];
          }
          pathStructures[sport].push(url);
        } else if (subcategory) {
          // Try subcategory
          const sportInSub = this.detectSportInSegment(subcategory, sportKeywords);
          if (sportInSub && sportInSub !== 'other') {
            if (!pathStructures[sportInSub]) {
              pathStructures[sportInSub] = [];
            }
            pathStructures[sportInSub].push(url);
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    // Convert to patterns
    for (const [sport, sportUrls] of Object.entries(pathStructures)) {
      if (sportUrls.length >= 2) { // At least 2 URLs to establish a pattern
        const pattern = this.findPattern(sportUrls);
        if (pattern && pattern.confidence >= 40) { // Lower threshold for structural patterns
          patterns[sport] = {
            pattern: pattern.pattern,
            confidence: pattern.confidence,
            url_count: sportUrls.length,
            sample_urls: sportUrls.slice(0, 5),
            variations: pattern.variations,
            detection_method: 'structural_analysis'
          };
        }
      }
    }
    
    return patterns;
  }
  
  // NEW: Detect sport in a single path segment
  detectSportInSegment(segment, sportKeywords) {
    const lowerSegment = segment.toLowerCase();
    
    for (const [sport, keywords] of Object.entries(sportKeywords)) {
      for (const keyword of keywords) {
        // Exact match or contains keyword
        if (lowerSegment === keyword || lowerSegment.includes(keyword)) {
          return sport;
        }
      }
    }
    
    return 'other';
  }
  
  groupBySport(urls, sportKeywords) {
    const grouped = {};
    
    // Look for article URLs with sport-specific patterns
    for (const url of urls) {
      const lowerUrl = url.toLowerCase();
      
      // Skip obvious non-article pages
      if (lowerUrl.includes('/tag/')) continue;
      if (lowerUrl.includes('/category/')) continue;
      if (lowerUrl.includes('/page/')) continue;
      if (lowerUrl.includes('?')) continue;
      
      // Try to detect sport and check if it's in an article pattern
      // Pattern we're looking for: /{sport}-news-article-title/
      const sport = this.detectSportInPath(lowerUrl, sportKeywords);
      
      if (sport && sport !== 'other') {
        if (!grouped[sport]) {
          grouped[sport] = [];
        }
        grouped[sport].push(url);
      }
    }
    
    return grouped;
  }
  
  detectSportInPath(url, sportKeywords) {
    // Look for sport keywords in the path segments
    // Pattern: /{sport}-news-* or /{sport}/news/* or /{sport}-*
    
    for (const [sport, keywords] of Object.entries(sportKeywords)) {
      for (const keyword of keywords) {
        // Skip generic keywords that might match too broadly
        if (keyword === 'football' && !url.includes('nfl')) continue;
        if (keyword === 'soccer' && !url.includes('premier-league') && !url.includes('la-liga')) continue;
        
        // Look for keyword followed by -news- (e.g., /boxing-news-article/)
        if (url.includes(`/${keyword}-news-`) || url.includes(`-${keyword}-news-`)) {
          return sport;
        }
        
        // Look for keyword in path segment (e.g., /boxing/news/)
        if (url.includes(`/${keyword}/`)) {
          return sport;
        }
      }
    }
    
    return 'other';
  }
  
  detectSport(url, sportKeywords) {
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
  
  findPattern(urls) {
    // Extract path segments from all URLs
    const pathSegments = urls.map(url => {
      try {
        const urlObj = new URL(url);
        return urlObj.pathname.split('/').filter(s => s && s.length > 0);
      } catch (error) {
        return [];
      }
    });
    
    if (pathSegments.length === 0) return null;
    
    // Find common prefix across all URLs
    const commonPrefix = this.findCommonPrefix(pathSegments);
    
    if (commonPrefix.length === 0) return null;
    
    // Generate pattern
    const pattern = '/' + commonPrefix.join('/') + '/*';
    
    // Calculate confidence (what % of URLs match this pattern)
    // Handle both /pattern/ and /pattern- cases (e.g., /boxing-news/ vs /boxing-news-)
    const prefixStr = '/' + commonPrefix.join('/');
    const matchCount = urls.filter(url => {
      return url.includes(prefixStr + '/') || url.includes(prefixStr + '-');
    }).length;
    let confidence = Math.round((matchCount / urls.length) * 100);
    
    // For small samples, adjust confidence based on sample size
    if (urls.length < 5) {
      confidence = Math.min(confidence, 75); // Cap at 75% for very small samples
    } else if (urls.length < 10) {
      confidence = Math.min(confidence, 85); // Cap at 85% for small samples
    }
    
    // Find variations (other common patterns)
    const variations = this.findVariations(urls, commonPrefix);
    
    return {
      pattern: pattern,
      confidence: confidence,
      variations: variations
    };
  }
  
  findCommonPrefix(pathSegments) {
    if (pathSegments.length === 0) return [];
    
    // For EssentiallySports and similar publishers,
    // the pattern is often /{sport}-news-article-title/
    // We want to extract just /{sport}-news/ as the pattern
    
    // If we only have 1 URL, try to extract a smart pattern
    if (pathSegments.length === 1) {
      const segments = pathSegments[0];
      if (segments.length > 0) {
        const firstSegment = segments[0];
        
        // If the segment contains "-news-", return everything up to and including "-news"
        if (firstSegment.includes('-news-')) {
          // Split on "-news-" and take the first part + "-news"
          const parts = firstSegment.split('-news-');
          return [parts[0] + '-news'];
        }
        
        // Otherwise just return the first segment
        return [segments[0]];
      }
    }
    
    // Original logic for multiple URLs
    const firstSegments = pathSegments[0];
    const common = [];
    
    // Check each segment position
    for (let i = 0; i < firstSegments.length; i++) {
      const segment = firstSegments[i];
      
      // Check if this segment appears in same position in all URLs
      const appearsInAll = pathSegments.every(segments => {
        return segments[i] === segment;
      });
      
      if (appearsInAll) {
        common.push(segment);
      } else {
        // Stop at first non-matching segment
        break;
      }
    }
    
    return common;
  }
  
  findVariations(urls, commonPrefix) {
    // Look for additional segments after common prefix
    const nextSegments = {};
    
    const prefixLen = commonPrefix.length;
    
    for (const url of urls) {
      try {
        const urlObj = new URL(url);
        const segments = urlObj.pathname.split('/').filter(s => s && s.length > 0);
        
        if (segments.length > prefixLen) {
          const nextSeg = segments[prefixLen];
          nextSegments[nextSeg] = (nextSegments[nextSeg] || 0) + 1;
        }
      } catch (error) {
        continue;
      }
    }
    
    // Return top 3 variations
    const sorted = Object.entries(nextSegments)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([seg, count]) => ({
        segment: seg,
        count: count,
        example_pattern: '/' + commonPrefix.join('/') + '/' + seg + '/*'
      }));
    
    return sorted;
  }
}

module.exports = PatternAnalyzer;

