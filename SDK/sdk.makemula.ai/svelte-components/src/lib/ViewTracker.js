import { log, logEvent } from "./Logger";
import { getCookie, setCookie, getTopLevelDomain } from './Cookies.js';

// GAM KVP tracking state
let gamKVPInitialized = false;
let gamInViewFired = false;

/**
 * GAM (Google Ad Manager) Integration for ViewTracker
 * 
 * This module provides reporting-only attribution for publishers by setting
 * GAM/GPT key-value pairs when the Mula widget comes into view.
 * 
 * Features:
 * - Sets `mula_in_view=1` when widget is 50% visible
 * - Reporting-only (no leakage to Prebid, APS, or bidstream)
 * - Sticky flag that persists for the pageview
 * - Optional reapply function for SPA environments
 * - Fallback to first product view if main widget trigger doesn't fire
 */

/**
 * Sets GPT targeting for GAM reporting-only attribution
 * @param {string} key - The targeting key
 * @param {string} value - The targeting value
 */
function setGptTargeting(key, value) {
    try {
        if(window.raptivetarget) {
            window.raptivetarget[key] = String(value);
        }
        if (window.googletag?.pubads) {
            window.googletag.pubads().setTargeting(key, [String(value)]);
            const slots = googletag.pubads().getSlots?.() || [];
            if (slots.length) 
                googletag.pubads().refresh(slots, { changeCorrelator: true });

            log(`GAM targeting set: ${key}=${value}`);
        } else {
            log('GAM: googletag.pubads not available', 'warn');
        }
    } catch (e) {
        log('GAM (GPT setTargeting) error: ' + e.message, 'error');
    }
}

/**
 * Applies GAM in-view targeting once
 */
export function applyGamInView() {
    if (gamInViewFired) return;
    gamInViewFired = true;
    setGptTargeting('mula_in_view', '1');

    // Optional analytics events (still reporting-only)
    try { 
        window.dataLayer?.push({ event: 'mula_in_view' }); 
        log('GAM: dataLayer event pushed');
    } catch (e) {
        log('GAM: dataLayer error - ' + e.message, 'warn');
    }
    
    try { 
        window.analytics?.track?.('Mula In View'); 
        log('GAM: analytics track called');
    } catch (e) {
        log('GAM: analytics error - ' + e.message, 'warn');
    }
}

/**
 * Creates an intersection observer to track when an element comes into view
 * @param {HTMLElement} element - The element to observe
 * @param {Object} widgetLogParams - Parameters to include in the log event
 */
export function setupViewTracking(element, widgetLogParams) {
    if (!element) return;

    // Initialize GAM KVP if not already done
    if (!gamKVPInitialized) {
        gamKVPInitialized = true;
        log('GAM KVP tracking initialized');
    }

    let loggedInView = false;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Log the event only once when element first comes into view (10%)
                if (!loggedInView) {
                    logEvent("mula_in_view", widgetLogParams.widget, { ...widgetLogParams });
                    
                    // Increment in-view count cookie (7 days)
                    const inViewCount = parseInt(getCookie('__mula_ivc') || '0', 10) + 1;
                    setCookie('__mula_ivc', inViewCount.toString(), { 
                        domain: getTopLevelDomain(), 
                        sameSite: 'lax',
                        days: 7
                    });
                    log(`In-view count incremented to: ${inViewCount}`);
                    
                    loggedInView = true;
                }
                
                // Apply GAM targeting when widget is 50% in view
                if (entry.intersectionRatio >= 0.5) {
                    applyGamInView();
                    // Disconnect after GAM targeting is applied
                    observer.disconnect();
                }
            }
        });
    }, {
        threshold: [0.1, 0.5] // Track both 10% and 50% visibility
    });

    observer.observe(element);
}

/**
 * Creates a single intersection observer to track multiple product cards efficiently
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Intersection threshold (0-1, default: 0.1)
 * @param {string} options.rootMargin - Root margin for early detection (default: '50px 0px')
 * @param {boolean} options.disconnectAfterView - Whether to stop tracking after first view (default: true)
 * @param {Object} options.widgetLogParams - Widget parameters to include in log events
 * @returns {Object} Observer controller with methods to add/remove cards
 */
export function createProductCardViewTracker(options = {}) {
    const {
        threshold = 0.1,
        rootMargin = '50px 0px',
        disconnectAfterView = true,
        widgetLogParams = {}
    } = options;

    // Track which cards have been viewed to avoid duplicate events
    // Use composite key: "type:id" to track both products and RevContent cards
    const viewedCards = new Set();
    let firstItemViewFired = false;
    
    // Create single observer for all cards (products, RevContent, and next page)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const cardElement = entry.target;
                const itemType = cardElement.dataset.itemType;
                const itemId = cardElement.dataset.itemId;
                
                // Skip cards without proper identifiers
                if (!itemType || !itemId) {
                    return;
                }
                
                // Create view key for duplicate prevention
                const viewKey = `${itemType}:${itemId}`;
                
                // Prevent duplicate view events
                if (viewedCards.has(viewKey)) {
                    return;
                }
                
                // Build event metadata
                const eventMeta = {
                    ...widgetLogParams,
                    item_type: itemType,
                    item_id: itemId
                };
                
                // Add type-specific ID field for backward compatibility
                if (itemType === 'product') {
                    eventMeta.product_id = itemId;
                } else if (itemType === 'revcontent') {
                    eventMeta.revcontent_uid = itemId;
                } else if (itemType === 'nextpage') {
                    eventMeta.article_url = itemId;
                }
                
                // Log the appropriate view event with dynamic event name
                const eventName = `mula_${itemType}_view`;
                logEvent(eventName, itemId, eventMeta);
                
                // Mark as viewed
                viewedCards.add(viewKey);
                
                // Apply GAM targeting on first item view (if main widget hasn't fired yet)
                // Applies to any item type (product, revcontent, or nextpage)
                if (!firstItemViewFired && !gamInViewFired) {
                    firstItemViewFired = true;
                    applyGamInView();
                    log(`GAM targeting applied on first ${itemType} view`);
                }
                
                // Optionally disconnect this specific target after first view
                if (disconnectAfterView) {
                    observer.unobserve(cardElement);
                }
            }
        });
    }, {
        threshold,
        rootMargin
    });

    // Return controller object with methods
    return {
        /**
         * Add a card element to view tracking
         * @param {HTMLElement} cardElement - The card DOM element
         * Must have data-item-type and data-item-id attributes
         */
        observe: (cardElement) => {
            if (cardElement && cardElement.dataset.itemType && cardElement.dataset.itemId) {
                observer.observe(cardElement);
            }
        },

        /**
         * Remove a card element from view tracking
         * @param {HTMLElement} cardElement - The card DOM element
         */
        unobserve: (cardElement) => {
            if (cardElement) {
                observer.unobserve(cardElement);
            }
        },

        /**
         * Add multiple card elements at once
         * @param {HTMLElement[]} cardElements - Array of card DOM elements
         */
        observeMultiple: (cardElements) => {
            cardElements.forEach(card => this.observe(card));
        },

        /**
         * Check if an item has been viewed
         * @param {string} itemType - The item type ('product', 'revcontent', 'nextpage')
         * @param {string} itemId - The item ID to check
         * @returns {boolean} Whether the item has been viewed
         */
        hasViewed: (itemType, itemId) => {
            return viewedCards.has(`${itemType}:${itemId}`);
        },

        /**
         * Get all viewed product IDs
         * @returns {Set} Set of viewed product IDs
         */
        getViewedProducts: () => {
            return new Set(viewedCards);
        },

        /**
         * Clear all tracking data
         */
        clear: () => {
            viewedCards.clear();
        },

        /**
         * Disconnect the observer and clean up
         */
        disconnect: () => {
            observer.disconnect();
            viewedCards.clear();
        }
    };
}

/**
 * Reapplies GAM targeting for SPA environments
 * Call this before ad refreshes to ensure targeting persists
 */
export function reapplyGamTargeting() {
    if (gamInViewFired) {
        setGptTargeting('mula_in_view', '1');
        log('GAM targeting reapplied');
    } else {
        log('GAM: No in-view event fired yet, cannot reapply', 'warn');
    }
}

/**
 * Gets the current GAM tracking state
 * @returns {Object} Current GAM tracking state
 */
export function getGamTrackingState() {
    return {
        initialized: gamKVPInitialized,
        inViewFired: gamInViewFired
    };
} 