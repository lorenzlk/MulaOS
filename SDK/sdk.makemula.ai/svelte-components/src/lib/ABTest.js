/**
 * A/B Test Utility for Mula SDK
 * Provides consistent variant assignment based on session ID
 */

import { simpleHash as hashString } from './HashHelpers.js';

// ============================================================================
// EXPERIMENT DEFINITIONS
// ============================================================================

const SMARTSCROLL_FACTORIAL_EXPERIMENT = {
    name: 'smartscroll_factorial_2025_09',
    variants: [
        { id: 'c00', name: 'Control', description: 'Current layout + Mula only' },
        { id: 'c10', name: 'Optimized Layout', description: 'Optimized layout + Mula only' },
        { id: 'c01', name: 'RevContent Monetization', description: 'Current layout + Mula + RevContent' },
        { id: 'c11', name: 'Optimized + RevContent', description: 'Optimized layout + Mula + RevContent' }
    ],
    description: 'CONCLUDED: 2x2 factorial test: Layout × Monetization',
    status: 'concluded',
    conclusion: 'Control (c00) won - current layout with Mula-only monetization performed best',
    endDate: '2025-10-03',
    finalResult: 'control_wins',
    factors: {
        layout: {
            control: 'current',
            treatment: 'optimized',
            description: 'Card layout optimization (removes brand header, expands image, redesigns meta strip)'
        },
        monetization: {
            control: 'mula_only',
            treatment: 'mula_plus_revcontent',
            description: 'Supplemental monetization partner (RevContent) added to existing Mula affiliate'
        }
    },
    activationCondition: () => {
        // Experiment concluded - always return false to stop running
        return false;
    }
};

export const SMARTSCROLL_BUTTON_EXPERIMENT = {
    name: 'smartscroll_button_variant',
    variants: ['control', 'buy_now'],
    description: 'CONCLUDED: Tests replacing View Details + Like buttons with single Buy Now button',
    status: 'concluded',
    conclusion: 'Treatment underperformed with -6.60% lift (p < 0.01)',
    endDate: '2025-09-06',
    finalResult: 'control_wins'
};

export const SMARTSCROLL_DENSITY_POSITION_EXPERIMENT = {
    name: 'smartscroll_density_position_2025_10',
    variants: [
        { id: 'control', name: 'Control', description: '3-1 products, position 4' },
        { id: 'density_inverted', name: 'Density Inverted', description: '3-1 articles, position 4' },
        { id: 'position_early', name: 'Position Early', description: '3-1 products, position 1' }
    ],
    description: 'CONCLUDED: Tests density and position of next page articles in SmartScroll',
    status: 'concluded',
    conclusion: 'Position Early won - +77.93% Next Page CTR lift with non-significant Store CTR impact',
    endDate: '2025-11-09',
    finalResult: 'position_early_wins',
    factors: {
        density: {
            control: '3_1_products',
            treatment: '3_1_articles',
            description: 'Ratio of products to articles in the feed'
        },
        position: {
            control: 'position_4',
            treatment: 'position_1',
            description: 'Starting position for next page articles'
        }
    },
    activationCondition: () => {
        // Experiment concluded - position_early is now the default behavior
        // Always return false to stop running the experiment
        return false;
    }
};

// ============================================================================
// ACTIVE EXPERIMENT CONFIGURATION
// ============================================================================

export const ACTIVE_EXPERIMENT = SMARTSCROLL_DENSITY_POSITION_EXPERIMENT;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Private property to track if variant was forced via query string
let _isForcedVariant = false;

/**
 * Get default variants for the active experiment
 * @returns {Array} Array of variant IDs
 */
function getDefaultVariants() {
    return ACTIVE_EXPERIMENT.variants.map(v => typeof v === 'string' ? v : v.id);
}

/**
 * Unified A/B test assignment API
 * @param {string} sessionId
 * @param {string} experimentName
 * @param {Array} variants
 * @returns {{ variant: string, logData: object }}
 */
export function getExperimentAssignment(sessionId, experimentName, variants = getDefaultVariants()) {
    const variant = getVariant(sessionId, experimentName, variants);
    
    // Handle special case where experiment should not run
    if (variant === 'no_experiment') {
        return { variant, logData: {} };
    }

    const logData = _isForcedVariant ? {} : { experiment: experimentName, variant };
    return { variant, logData };
}

function getVariant(sessionId, experimentName, variants = getDefaultVariants()) {
    // Reset forced variant flag
    _isForcedVariant = false;
    
    // Check for query string override first (for testing purposes)
    if (typeof window !== 'undefined' && window.location) {
        const url = new URL(window.location.href);
        const queryOverride = url.searchParams.get('mulaABTest');
        if (queryOverride && variants.includes(queryOverride)) {
            _isForcedVariant = true;
            return queryOverride;
        }
    }

    if (ACTIVE_EXPERIMENT.activationCondition()) {
        // RevContent is properly configured - run the factorial experiment
        const hash = parseInt(hashString(sessionId + experimentName), 36);
        const index = hash % variants.length;
        return variants[index]; // Returns c00, c10, c01, or c11
    }
    
    // RevContent not configured - don't run the experiment
    return 'no_experiment';
}


/**
 * Check if a variant was forced via query string override
 * @returns {boolean} True if the variant was forced
 */
export function isVariantForced() {
    return _isForcedVariant;
}


/**
 * Get variant object by ID
 * @param {string} variantId - The variant ID (c00, c10, c01, c11)
 * @returns {object} Variant object with id, name, description
 */
export function getVariantInfo(variantId) {
    const experiment = ACTIVE_EXPERIMENT;
    return experiment.variants.find(v => v.id === variantId) || {
        id: variantId,
        name: 'Unknown',
        description: 'Unknown variant'
    };
}

/**
 * Get variant display name for reports
 * @param {string} variantId - The variant ID
 * @returns {string} Human-readable name
 */
export function getVariantDisplayName(variantId) {
    return getVariantInfo(variantId).name;
}

/**
 * Extract layout factor from variant
 * @param {string} variantId - The variant ID
 * @returns {string} Layout factor (current|optimized)
 */
export function getLayoutFactor(variantId) {
    return variantId.startsWith('c1') ? 'optimized' : 'current';
}

/**
 * Extract monetization factor from variant
 * @param {string} variantId - The variant ID
 * @returns {string} Monetization factor (mula_only|mula_plus_revcontent)
 */
export function getMonetizationFactor(variantId) {
    return variantId.endsWith('1') ? 'mula_plus_revcontent' : 'mula_only';
}

/**
 * Extract density factor from variant
 * @param {string} variantId - The variant ID
 * @returns {string} Density factor (3_1_products|3_1_articles)
 */
export function getDensityFactor(variantId) {
    return variantId === 'density_inverted' ? '3_1_articles' : '3_1_products';
}

/**
 * Extract position factor from variant
 * @param {string} variantId - The variant ID
 * @returns {string} Position factor (position_1|position_4)
 */
export function getPositionFactor(variantId) {
    return variantId === 'position_early' ? 'position_1' : 'position_4';
}

/**
 * Get variant description for reporting (server-side)
 * @param {string} variantId - The variant ID
 * @returns {object} Full variant description
 */
export function getVariantDescription(variantId) {
    const experiment = SMARTSCROLL_FACTORIAL_EXPERIMENT;
    const variant = experiment.variants.find(v => v.id === variantId);
    
    if (!variant) {
        return {
            id: variantId,
            name: 'Unknown',
            description: 'Unknown variant',
            layout: 'unknown',
            monetization: 'unknown'
        };
    }
    
    return {
        id: variant.id,
        name: variant.name,
        description: variant.description,
        layout: getLayoutFactor(variantId),
        monetization: getMonetizationFactor(variantId)
    };
}
