const { DomainChannelMapping } = require('../models');
const { WebClient } = require('@slack/web-api');

const slackClient = new WebClient(process.env.SLACK_TOKEN);

/**
 * Add a new domain-channel mapping
 * @param {string} domain - The domain name
 * @param {string} channelId - The Slack channel ID
 * @param {string} channelName - The Slack channel name (from command payload)
 * @param {string} displayName - Optional display name for the domain
 * @returns {Promise<Object>} The created mapping
 */
async function addDomainChannelMapping(domain, channelId, channelName, displayName = null) {
  try {
    // Check if mapping already exists
    const existingMapping = await DomainChannelMapping.findOne({
      where: { domain }
    });
    
    if (existingMapping) {
      throw new Error(`Mapping for domain '${domain}' already exists`);
    }
    
    // Create new mapping
    const mapping = await DomainChannelMapping.create({
      domain,
      channelId,
      channelName: `#${channelName}`,
      displayName
    });
    
    return mapping;
  } catch (error) {
    console.error('Error adding domain-channel mapping:', error);
    throw error;
  }
}

/**
 * List all domain-channel mappings
 * @returns {Promise<Array>} Array of all mappings
 */
async function listDomainChannelMappings() {
  try {
    const mappings = await DomainChannelMapping.findAll({
      order: [['domain', 'ASC']]
    });
    
    return mappings;
  } catch (error) {
    console.error('Error listing domain-channel mappings:', error);
    throw error;
  }
}

/**
 * Remove a domain-channel mapping
 * @param {string} domain - The domain name to remove
 * @returns {Promise<boolean>} True if mapping was removed, false if it didn't exist
 */
async function removeDomainChannelMapping(domain) {
  try {
    const mapping = await DomainChannelMapping.findOne({
      where: { domain }
    });
    
    if (!mapping) {
      return false;
    }
    
    await mapping.destroy();
    return true;
  } catch (error) {
    console.error('Error removing domain-channel mapping:', error);
    throw error;
  }
}

/**
 * Get all domain-channel mappings as objects for use in reports
 * @returns {Promise<Object>} Object with domain as key and channel name as value
 */
async function getDomainChannelMappingsForReports() {
  try {
    const mappings = await DomainChannelMapping.findAll({
      order: [['domain', 'ASC']]
    });
    
    const sites = {};
    const displayNames = {};
    
    mappings.forEach(mapping => {
      sites[mapping.domain] = mapping.channelName;
      if (mapping.displayName) {
        displayNames[mapping.domain] = mapping.displayName;
      }
    });
    
    return { sites, displayNames };
  } catch (error) {
    console.error('Error getting domain-channel mappings for reports:', error);
    throw error;
  }
}

/**
 * Get channel name for a specific domain
 * @param {string} domain - The domain name
 * @returns {Promise<string|null>} The channel name or null if not found
 */
async function getChannelForDomain(domain) {
  try {
    const mapping = await DomainChannelMapping.findOne({
      where: { domain }
    });
    
    return mapping ? mapping.channelName : null;
  } catch (error) {
    console.error('Error getting channel for domain:', error);
    throw error;
  }
}

module.exports = {
  addDomainChannelMapping,
  listDomainChannelMappings,
  removeDomainChannelMapping,
  getDomainChannelMappingsForReports,
  getChannelForDomain
}; 