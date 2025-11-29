const { getUserEmail } = require('./SlackUserEmail');

/**
 * Check if user has access to a domain
 * @param {string} userEmail - User's email address
 * @param {string} domain - Domain to check access for
 * @returns {Promise<Object>} Permission check result
 */
async function checkDomainPermission(userEmail, domain) {
  if (!userEmail) {
    return { allowed: false, reason: 'no_email' };
  }

  if (!domain) {
    return { allowed: false, reason: 'no_domain' };
  }

  // 1. Check if user is Offline Studio admin (can access all domains)
  if (userEmail.endsWith('@offlinestudio.com')) {
    return { allowed: true, reason: 'offline_studio_admin' };
  }

  // 2. Check domain_user_permissions table (interim solution)
  // TODO: When Account model is implemented, check account_users instead
  try {
    const { DomainUserPermission } = require('../models');
    
    const permission = await DomainUserPermission.findOne({
      where: {
        user_email: userEmail,
        domain: domain,
        isActive: true
      }
    });

    if (permission) {
      return { 
        allowed: true, 
        reason: 'domain_permission', 
        role: permission.role 
      };
    }
  } catch (error) {
    // If table doesn't exist yet, log and continue
    if (error.name === 'SequelizeDatabaseError' && error.message.includes('does not exist')) {
      console.log('⚠️ domain_user_permissions table not found, skipping permission check');
    } else {
      console.error('Error checking domain permission:', error);
    }
  }

  // 3. No permission found
  return { allowed: false, reason: 'no_permission' };
}

/**
 * Check domain permission for a Slack user
 * @param {string} userId - Slack user ID
 * @param {string} domain - Domain to check access for
 * @returns {Promise<Object>} Permission check result
 */
async function checkDomainPermissionForUser(userId, domain) {
  const userEmail = await getUserEmail(userId);
  return checkDomainPermission(userEmail, domain);
}

/**
 * Get list of domains user has access to
 * @param {string} userEmail - User's email address
 * @returns {Promise<Array<string>>} List of accessible domains
 */
async function getUserDomains(userEmail) {
  if (!userEmail) {
    return [];
  }

  // Offline Studio admins have access to all domains
  // In practice, we'd need to query all domains, but for now return empty array
  // (they'll pass permission checks anyway)
  if (userEmail.endsWith('@offlinestudio.com')) {
    return []; // Special case - they have access to everything
  }

  try {
    const { DomainUserPermission } = require('../models');
    
    const permissions = await DomainUserPermission.findAll({
      where: {
        user_email: userEmail,
        isActive: true
      },
      attributes: ['domain'],
      raw: true
    });

    return permissions.map(p => p.domain);
  } catch (error) {
    if (error.name === 'SequelizeDatabaseError' && error.message.includes('does not exist')) {
      console.log('⚠️ domain_user_permissions table not found');
      return [];
    }
    console.error('Error getting user domains:', error);
    return [];
  }
}

module.exports = {
  checkDomainPermission,
  checkDomainPermissionForUser,
  getUserDomains
};

