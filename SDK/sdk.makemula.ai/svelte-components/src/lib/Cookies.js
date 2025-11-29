/**
 * Cookie management utilities for Mula SDK
 */

/**
 * Get the top-level domain for cookie setting
 * @returns {string} - Top-level domain (e.g., ".on3.com")
 */
export const getTopLevelDomain = () => {
  const parts = window.location.hostname.split('.');
  if (parts.length >= 2) {
    return '.' + parts.slice(-2).join('.');
  }
  return window.location.hostname;
};

/**
 * Get a cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} - Cookie value or null if not found
 */
export const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

/**
 * Set a cookie value
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {Object} options - Cookie options
 * @param {number} options.days - Number of days until expiration (optional, defaults to session cookie)
 * @param {number} options.maxAge - Max age in seconds (optional)
 * @param {string} options.domain - Cookie domain (optional)
 * @param {string} options.sameSite - SameSite attribute (optional, defaults to 'lax')
 */
export const setCookie = (name, value, options = {}) => {
  let cookieString = `${name}=${value};path=/`;
  
  // Add domain if specified
  if (options.domain) {
    cookieString += `;domain=${options.domain}`;
  }
  
  // Add sameSite if specified
  if (options.sameSite) {
    cookieString += `;samesite=${options.sameSite}`;
  }
  
  // Add expiration (prefer maxAge over days)
  if (options.maxAge !== undefined) {
    cookieString += `;max-age=${options.maxAge}`;
  } else if (options.days !== null && options.days !== undefined) {
    const expires = new Date();
    expires.setTime(expires.getTime() + options.days * 24 * 60 * 60 * 1000);
    cookieString += `;expires=${expires.toUTCString()}`;
  }
  
  document.cookie = cookieString;
};

/**
 * Delete a cookie by setting it to expire in the past
 * @param {string} name - Cookie name
 */
export const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

/**
 * Check if a cookie exists
 * @param {string} name - Cookie name
 * @returns {boolean} - True if cookie exists
 */
export const hasCookie = (name) => {
  return getCookie(name) !== null;
};
