/**
 * Hash utility functions for Mula SDK
 */

/**
 * Simple hash function for pathnames (more compact than SHA256)
 * @param {string} str - String to hash
 * @returns {string} - Base36 encoded hash
 */
export const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36); // Convert to base36 for shorter string
};
