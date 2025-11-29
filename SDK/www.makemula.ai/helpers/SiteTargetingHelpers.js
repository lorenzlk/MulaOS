const { SiteTargeting } = require('../models');

/**
 * Add a new site targeting record
 * @param {string} topLevelDomain - The top-level domain
 * @param {string} targetingType - Type of targeting (path_substring, url_pattern, ld_json)
 * @param {string} targetingValue - The targeting value
 * @param {string} searchPhrase - Search phrase to use when targeting matches
 * @param {string} channelId - Slack channel ID
 * @param {string} channelName - Slack channel name
 * @returns {Promise<Object>} The created targeting record
 */
async function addSiteTargeting(topLevelDomain, targetingType, targetingValue, searchPhrase, channelId, channelName) {
  try {
    // Validate targeting type
    const validTypes = ['path_substring', 'url_pattern', 'ld_json', 'keyword_substring'];
    if (!validTypes.includes(targetingType)) {
      throw new Error(`Invalid targeting type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate URL pattern if targeting type is url_pattern
    if (targetingType === 'url_pattern') {
      try {
        new RegExp(targetingValue);
      } catch (error) {
        throw new Error('Invalid regex pattern for url_pattern targeting type');
      }
    }

    const targeting = await SiteTargeting.create({
      topLevelDomain: topLevelDomain.toLowerCase(),
      targetingType,
      targetingValue,
      searchPhrase,
      channelId,
      channelName
    });

    console.log(`✅ Added site targeting record: ${targeting.id} for ${topLevelDomain}`);
    return targeting;
  } catch (error) {
    console.error('❌ Error adding site targeting:', error);
    throw error;
  }
}

/**
 * List site targeting records, optionally filtered by domain
 * @param {string} topLevelDomain - Optional domain filter
 * @param {boolean} includeDeleted - Whether to include soft-deleted records (default: false)
 * @returns {Promise<Array>} Array of targeting records with search information
 */
async function listSiteTargeting(topLevelDomain = null, includeDeleted = false) {
  try {
    const whereClause = topLevelDomain ? { topLevelDomain: topLevelDomain.toLowerCase() } : {};
    
    const targetingRecords = await SiteTargeting.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      paranoid: includeDeleted ? false : true // Include soft-deleted records only if requested
    });

    // Look up search information for each targeting record
    const { Search } = require('../models');
    const recordsWithSearchInfo = [];
    
    for (const record of targetingRecords) {
      const search = await Search.findOne({ 
        where: { phrase: record.searchPhrase },
        attributes: ['id', 'phrase', 'status']
      });
      
      const recordWithSearch = record.toJSON();
      recordWithSearch.search = search;
      recordsWithSearchInfo.push(recordWithSearch);
    }

    console.log(`✅ Found ${targetingRecords.length} site targeting records`);
    return recordsWithSearchInfo;
  } catch (error) {
    console.error('❌ Error listing site targeting:', error);
    throw error;
  }
}

/**
 * Remove a site targeting record by ID
 * @param {number} targetingId - The ID of the targeting record to remove
 * @returns {Promise<boolean>} True if record was deleted, false if not found
 */
async function removeSiteTargeting(targetingId) {
  try {
    const targeting = await SiteTargeting.findByPk(targetingId, { paranoid: false });
    
    if (!targeting) {
      console.log(`⚠️ Site targeting record ${targetingId} not found`);
      return false;
    }

    // Use soft delete (paranoid: true is default)
    await targeting.destroy();
    console.log(`✅ Soft deleted site targeting record: ${targetingId}`);
    return true;
  } catch (error) {
    console.error('❌ Error removing site targeting:', error);
    throw error;
  }
}

/**
 * Get targeting records for a specific domain
 * @param {string} topLevelDomain - The top-level domain
 * @returns {Promise<Array>} Array of targeting records for the domain
 */
async function getTargetingForDomain(topLevelDomain) {
  try {
    const targetingRecords = await SiteTargeting.findAll({
      where: { topLevelDomain: topLevelDomain.toLowerCase() },
      order: [['createdAt', 'ASC']],
      paranoid: true // Only include active (non-deleted) records for manifest
    });

    // Filter to only include targeting rules where the associated search is approved
    const { Search } = require('../models');
    const filteredRecords = [];
    
    for (const targeting of targetingRecords) {
      const search = await Search.findOne({ where: { phrase: targeting.searchPhrase } });
      if (search && search.status === 'approved') {
        // Add phraseID to the targeting record for manifest generation
        const targetingWithPhraseID = targeting.toJSON();
        targetingWithPhraseID.phraseID = search.phraseID;
        filteredRecords.push(targetingWithPhraseID);
      } else {
        console.log(`⚠️ Skipping targeting rule ${targeting.id} - search "${targeting.searchPhrase}" not approved (status: ${search?.status || 'not found'})`);
      }
    }

    return filteredRecords;
  } catch (error) {
    console.error('❌ Error getting targeting for domain:', error);
    throw error;
  }
}

/**
 * Check if a URL matches any targeting rules for a domain
 * @param {string} url - The URL to check
 * @param {string} topLevelDomain - The top-level domain
 * @param {string} pageContext - The page context from JSON-LD (optional)
 * @returns {Promise<Object|null>} Matching targeting record or null
 */
async function checkTargetingMatch(url, topLevelDomain, pageContext = null) {
  try {
    const targetingRecords = await getTargetingForDomain(topLevelDomain);
    
    for (const targeting of targetingRecords) {
      let matches = false;
      
      switch (targeting.targetingType) {
        case 'path_substring':
          // Query-string agnostic match between specified path and current page URL
          const urlPath = new URL(url).pathname;
          matches = urlPath.includes(targeting.targetingValue);
          break;
          
        case 'url_pattern':
          // Regex match against the full URL
          try {
            const regex = new RegExp(targeting.targetingValue);
            matches = regex.test(url);
          } catch (error) {
            console.warn(`Invalid regex pattern in targeting record ${targeting.id}:`, targeting.targetingValue);
            continue;
          }
          break;
          
        case 'ld_json':
          // Match against JSON-LD articleSection
          if (pageContext && targeting.targetingValue) {
            matches = pageContext.toLowerCase().includes(targeting.targetingValue.toLowerCase());
          }
          break;
          
        case 'keyword_substring':
          // Match against article keywords array
          if (pageContext && pageContext.tags && Array.isArray(pageContext.tags)) {
            matches = pageContext.tags.some(keyword => 
              keyword.toLowerCase().includes(targeting.targetingValue.toLowerCase())
            );
          }
          break;
      }
      
      if (matches) {
        console.log(`✅ Targeting match found: ${targeting.id} (${targeting.targetingType})`);
        return targeting;
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error checking targeting match:', error);
    throw error;
  }
}

module.exports = {
  addSiteTargeting,
  listSiteTargeting,
  removeSiteTargeting,
  getTargetingForDomain,
  checkTargetingMatch
}; 