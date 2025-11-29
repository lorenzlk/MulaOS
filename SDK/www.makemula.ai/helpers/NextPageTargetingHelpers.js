const { NextPageTargeting } = require('../models');

/**
 * Add a new next-page targeting record
 * @param {string} topLevelDomain - The top-level domain
 * @param {string} targetingType - Type of targeting (path_substring, url_pattern, ld_json, keyword_substring)
 * @param {string} targetingValue - The targeting value
 * @param {string} sectionName - Section name for manifest path
 * @param {number} lookbackDays - Number of days to look back for articles
 * @param {number} limit - Maximum number of articles
 * @param {string} channelId - Slack channel ID
 * @param {string} channelName - Slack channel name
 * @returns {Promise<Object>} The created targeting record
 */
async function addNextPageTargeting(topLevelDomain, targetingType, targetingValue, sectionName, lookbackDays, limit, channelId, channelName) {
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

    // Validate lookbackDays
    if (lookbackDays < 1 || lookbackDays > 90) {
      throw new Error('Lookback days must be between 1 and 90');
    }

    // Validate limit
    if (limit < 1 || limit > 50) {
      throw new Error('Limit must be between 1 and 50');
    }

    const targeting = await NextPageTargeting.create({
      topLevelDomain: topLevelDomain.toLowerCase(),
      targetingType,
      targetingValue,
      sectionName: sectionName.toLowerCase(),
      lookbackDays,
      limit,
      channelId,
      channelName
    });

    console.log(`✅ Added next-page targeting record: ${targeting.id} for ${topLevelDomain} (section: ${sectionName})`);
    return targeting;
  } catch (error) {
    console.error('❌ Error adding next-page targeting:', error);
    throw error;
  }
}

/**
 * List next-page targeting records, optionally filtered by domain
 * @param {string} topLevelDomain - Optional domain filter
 * @param {boolean} includeDeleted - Whether to include soft-deleted records (default: false)
 * @returns {Promise<Array>} Array of targeting records
 */
async function listNextPageTargeting(topLevelDomain = null, includeDeleted = false) {
  try {
    const whereClause = topLevelDomain ? { topLevelDomain: topLevelDomain.toLowerCase() } : {};
    
    const targetingRecords = await NextPageTargeting.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      paranoid: includeDeleted ? false : true // Include soft-deleted records only if requested
    });

    console.log(`✅ Found ${targetingRecords.length} next-page targeting records`);
    return targetingRecords.map(record => record.toJSON());
  } catch (error) {
    console.error('❌ Error listing next-page targeting:', error);
    throw error;
  }
}

/**
 * Remove a next-page targeting record by ID
 * @param {number} targetingId - The ID of the targeting record to remove
 * @returns {Promise<boolean>} True if record was deleted, false if not found
 */
async function removeNextPageTargeting(targetingId) {
  try {
    const targeting = await NextPageTargeting.findByPk(targetingId, { paranoid: false });
    
    if (!targeting) {
      console.log(`⚠️ Next-page targeting record ${targetingId} not found`);
      return false;
    }

    // Use soft delete (paranoid: true is default)
    await targeting.destroy();
    console.log(`✅ Soft deleted next-page targeting record: ${targetingId}`);
    return true;
  } catch (error) {
    console.error('❌ Error removing next-page targeting:', error);
    throw error;
  }
}

/**
 * Get targeting records for a specific domain
 * @param {string} topLevelDomain - The top-level domain
 * @returns {Promise<Array>} Array of targeting records for the domain
 */
async function getNextPageTargetingForDomain(topLevelDomain) {
  try {
    const targetingRecords = await NextPageTargeting.findAll({
      where: { topLevelDomain: topLevelDomain.toLowerCase() },
      order: [['createdAt', 'ASC']],
      paranoid: true // Only include active (non-deleted) records for manifest
    });

    return targetingRecords.map(record => record.toJSON());
  } catch (error) {
    console.error('❌ Error getting next-page targeting for domain:', error);
    throw error;
  }
}

/**
 * Find or create a next-page targeting record (upsert)
 * @param {string} topLevelDomain - The top-level domain
 * @param {string} targetingType - Type of targeting
 * @param {string} targetingValue - The targeting value
 * @param {string} sectionName - Section name
 * @param {number} lookbackDays - Number of days to look back
 * @param {number} limit - Maximum number of articles
 * @param {string} channelId - Slack channel ID
 * @param {string} channelName - Slack channel name
 * @returns {Promise<Object>} The targeting record
 */
async function upsertNextPageTargeting(topLevelDomain, targetingType, targetingValue, sectionName, lookbackDays, limit, channelId, channelName) {
  try {
    // Try to find existing record by domain, targetingType, targetingValue, and sectionName
    const existing = await NextPageTargeting.findOne({
      where: {
        topLevelDomain: topLevelDomain.toLowerCase(),
        targetingType,
        targetingValue,
        sectionName: sectionName.toLowerCase()
      },
      paranoid: false // Include soft-deleted records to restore them
    });

    if (existing) {
      // Update existing record (restore if soft-deleted)
      existing.lookbackDays = lookbackDays;
      existing.limit = limit;
      existing.channelId = channelId;
      existing.channelName = channelName;
      existing.deletedAt = null; // Restore if soft-deleted
      await existing.save();
      console.log(`✅ Updated next-page targeting record: ${existing.id}`);
      return existing;
    } else {
      // Create new record
      return await addNextPageTargeting(
        topLevelDomain,
        targetingType,
        targetingValue,
        sectionName,
        lookbackDays,
        limit,
        channelId,
        channelName
      );
    }
  } catch (error) {
    console.error('❌ Error upserting next-page targeting:', error);
    throw error;
  }
}

/**
 * Generate section name from category or path
 * @param {string} categoryOrPath - Category name or URL path
 * @returns {string} Valid section name
 */
function generateSectionName(categoryOrPath) {
  if (!categoryOrPath) {
    throw new Error('Category or path is required');
  }

  // Remove leading/trailing slashes and whitespace
  let section = categoryOrPath.trim().replace(/^\/+|\/+$/g, '');
  
  // Replace slashes with hyphens
  section = section.replace(/\//g, '-');
  
  // Replace spaces with hyphens
  section = section.replace(/\s+/g, '-');
  
  // Remove special characters except hyphens
  section = section.replace(/[^a-z0-9-]/gi, '');
  
  // Convert to lowercase
  section = section.toLowerCase();
  
  // Remove multiple consecutive hyphens
  section = section.replace(/-+/g, '-');
  
  // Remove leading/trailing hyphens
  section = section.replace(/^-+|-+$/g, '');
  
  if (!section) {
    throw new Error('Could not generate valid section name from category or path');
  }
  
  return section;
}

/**
 * Calculate priority for a targeting value (lower number = higher priority)
 * @param {string} targetingType - Type of targeting
 * @param {string} targetingValue - The targeting value
 * @returns {number} Priority value
 */
function calculatePriority(targetingType, targetingValue) {
  switch (targetingType) {
    case 'path_substring':
      // More specific paths (deeper) get higher priority (lower number)
      const depth = targetingValue.split('/').filter(Boolean).length;
      return depth;
    
    case 'ld_json':
      // JSON-LD categories get highest priority
      return 0;
    
    case 'url_pattern':
      // URL patterns get medium priority (estimate by complexity)
      const complexity = (targetingValue.match(/\//g) || []).length;
      return Math.max(1, complexity);
    
    case 'keyword_substring':
      // Keywords get lower priority
      return 10;
    
    default:
      return 5;
  }
}

module.exports = {
  addNextPageTargeting,
  listNextPageTargeting,
  removeNextPageTargeting,
  getNextPageTargetingForDomain,
  upsertNextPageTargeting,
  generateSectionName,
  calculatePriority
};

