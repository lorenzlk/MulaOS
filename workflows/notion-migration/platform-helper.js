/**
 * Platform Mapping Helper Functions
 * 
 * Functions to help map and validate Platform values
 */

function mapPlatform(platform) {
  /**
   * Maps Platform values from Notion to Google Sheets format
   * Converts "Mobile, Web" to "Desktop, Mobile" and "Web" to "Desktop"
   * @param {string} platform - Platform value from Notion
   * @return {string} Mapped platform value
   */
  if (!platform || platform.trim() === '') return '';
  
  const platformLower = platform.toLowerCase().trim();
  
  // Handle "Mobile, Web" or "Web, Mobile" → "Desktop, Mobile"
  if (platformLower.includes('mobile') && platformLower.includes('web')) {
    return 'Desktop, Mobile';
  }
  
  // Handle "Web" → "Desktop"
  if (platformLower === 'web') {
    return 'Desktop';
  }
  
  // Handle "Mobile" → "Mobile"
  if (platformLower === 'mobile') {
    return 'Mobile';
  }
  
  // Handle "Desktop, Mobile" or "Mobile, Desktop" → normalize to "Desktop, Mobile"
  if (platformLower.includes('desktop') && platformLower.includes('mobile')) {
    return 'Desktop, Mobile';
  }
  
  // Default: return as-is (should be Desktop or Mobile)
  return platform;
}

function validatePlatform(platform) {
  /**
   * Validates platform value
   * @param {string} platform - Platform value to validate
   * @return {boolean} True if valid
   */
  if (!platform || platform.trim() === '') return true; // Empty is OK
  
  const validPlatforms = ['Desktop', 'Mobile'];
  const platforms = platform.split(',').map(p => p.trim());
  
  // Check that all platforms are valid
  for (const p of platforms) {
    if (!validPlatforms.includes(p)) {
      return false;
    }
  }
  
  // Check for duplicates
  const uniquePlatforms = [...new Set(platforms)];
  if (uniquePlatforms.length !== platforms.length) {
    return false; // Duplicates found
  }
  
  return true;
}

function getPlatformList(platformString) {
  /**
   * Converts platform string to array
   * @param {string} platformString - Platform selection
   * @return {Array} Array of platform names
   */
  if (!platformString || platformString.trim() === '') return [];
  return platformString.split(',').map(p => p.trim()).filter(p => p);
}

function hasPlatform(platformString, platformName) {
  /**
   * Checks if a specific platform is selected
   * @param {string} platformString - Platform selection
   * @param {string} platformName - Platform to check for (Desktop or Mobile)
   * @return {boolean} True if platform is included
   */
  if (!platformString) return false;
  const platforms = getPlatformList(platformString);
  return platforms.includes(platformName);
}

function hasDesktop(platformString) {
  return hasPlatform(platformString, 'Desktop');
}

function hasMobile(platformString) {
  return hasPlatform(platformString, 'Mobile');
}

function hasBothPlatforms(platformString) {
  return hasDesktop(platformString) && hasMobile(platformString);
}

