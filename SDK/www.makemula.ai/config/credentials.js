/**
 * Credential Configuration
 * 
 * This file defines the available credential sets for different platforms
 * that can be used for product searches. Each credential set maps
 * to environment variables for access keys, secret keys, and account IDs.
 */

const AMAZON_CREDENTIALS = {
  default: {
    name: 'Default (Mula)',
    envVars: {
      accessKeyId: 'MULA_AMAZON_ASSOC_ACCESS_KEY_ID',
      secretKey: 'MULA_AMAZON_ASSOC_SECRET_KEY',
      accountId: 'MULA_AMAZON_ASSOC_ACCOUNT_ID'
    }
  },
  mcclatchy: {
    name: 'McClatchy',
    envVars: {
      accessKeyId: 'MCCLATCHY_AMAZON_ASSOC_ACCESS_KEY_ID',
      secretKey: 'MCCLATCHY_AMAZON_ASSOC_SECRET_KEY',
      accountId: 'MCCLATCHY_AMAZON_ASSOC_ACCOUNT_ID'
    }
  },
  britco: {
    name: 'Brit.co',
    envVars: {
      accessKeyId: 'BRITCO_AMAZON_ASSOC_ACCESS_KEY_ID',
      secretKey: 'BRITCO_AMAZON_ASSOC_SECRET_KEY',
      accountId: 'BRITCO_AMAZON_ASSOC_ACCOUNT_ID'
    }
  }
};

const IMPACT_CREDENTIALS = {
  on3: {
    name: 'ON3 (Impact)',
    envVars: {
      accountId: 'IMPACT_ACCOUNT_ID',
      username: 'IMPACT_USERNAME',
      password: 'IMPACT_PASSWORD',
      catalogId: 'IMPACT_CATALOG_ID'
    }
  }
};

/**
 * Get all available credential IDs for a platform
 * @param {string} platform - The platform (amazon, impact)
 * @returns {string[]} Array of credential IDs
 */
function getCredentialIds(platform = 'amazon') {
  if (platform === 'amazon') {
    return Object.keys(AMAZON_CREDENTIALS);
  } else if (platform === 'impact') {
    return Object.keys(IMPACT_CREDENTIALS);
  }
  return [];
}

/**
 * Get credential configuration by ID and platform
 * @param {string} credentialId - The credential ID
 * @param {string} platform - The platform (amazon, impact)
 * @returns {Object|null} Credential configuration or null if not found
 */
function getCredentialConfig(credentialId, platform = 'amazon') {
  if (platform === 'amazon') {
    return AMAZON_CREDENTIALS[credentialId] || null;
  } else if (platform === 'impact') {
    return IMPACT_CREDENTIALS[credentialId] || null;
  }
  return null;
}

/**
 * Get credential names for UI display
 * @param {string} platform - The platform (amazon, impact)
 * @returns {Object} Object mapping credential IDs to display names
 */
function getCredentialNames(platform = 'amazon') {
  const names = {};
  const credentials = platform === 'amazon' ? AMAZON_CREDENTIALS : IMPACT_CREDENTIALS;
  Object.keys(credentials).forEach(id => {
    names[id] = credentials[id].name;
  });
  return names;
}

/**
 * Resolve actual credentials from environment variables
 * @param {string} credentialId - The credential ID
 * @param {string} platform - The platform (amazon, impact)
 * @returns {Object} Resolved credentials
 */
function resolveCredentials(credentialId, platform = 'amazon') {
  if (!credentialId) {
    throw new Error(`Credential ID is required for platform: ${platform}`);
  }

  const config = getCredentialConfig(credentialId, platform);
  if (!config) {
    const availableIds = getCredentialIds(platform);
    throw new Error(`Invalid credential ID: ${credentialId}. Available for ${platform}: ${availableIds.join(', ')}`);
  }

  const credentials = {};
  Object.entries(config.envVars).forEach(([key, envVar]) => {
    credentials[key] = process.env[envVar];
  });

  // Validate that all required credentials exist
  const missing = Object.entries(credentials)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing credentials for ${credentialId} (${platform}): ${missing.join(', ')}`);
  }

  return credentials;
}

/**
 * Check if credentials are available for a given credential ID
 * @param {string} credentialId - The credential ID
 * @param {string} platform - The platform (amazon, impact)
 * @returns {boolean} True if all credentials are available
 */
function hasCredentials(credentialId, platform = 'amazon') {
  try {
    resolveCredentials(credentialId, platform);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  AMAZON_CREDENTIALS,
  IMPACT_CREDENTIALS,
  getCredentialIds,
  getCredentialConfig,
  getCredentialNames,
  resolveCredentials,
  hasCredentials
};
