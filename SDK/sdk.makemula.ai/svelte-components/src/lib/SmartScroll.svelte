<svelte:options tag="mula-smartscroll" />
<style>
    main {
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif;
        
        margin: 0;
        padding: var(--mula-main-padding, 0px);
        display: flex;
        flex-direction: column;
        align-items: center;
        min-height: 100vh;
        overflow-x: visible;
    }
    
    h1 {
        margin-bottom: 30px;
        text-align: center;
        font-weight: 500;
        color: #1d1d1f;
    }
    
    .container {
        max-width: var(--mula-container-max-width, 100%);
        width: 100%;
    }
    
    /* Widget 15 - Vertical Product Feed */
    .mula-widget-15 {
        position: relative;
        width: 100%;
        margin: 25px auto;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif;
        overflow-x: visible;
    }
    
    .mula-feed-container {
        position: relative;
        width: 100%;
        min-height: 100vh;
        contain: content;
        will-change: transform;
    }
    
    .mula-feed {
        display: flex;
        box-sizing: border-box;
        gap: 24px;
        flex-direction: column;
        width: 100%;
        transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000px;
        padding-top: 12px;
    }
    
    .mula-card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        display: flex;
        flex-direction: column;
        transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        width: 100%;
        position: relative;
        overflow-x: visible;
        box-sizing: border-box;
        border: var(--mula-card-border, none);
    }

    /* Optimized Layout Variant - New Design */
    .mula-card.optimized-layout {
        /* Optimized card specific styles */
        border: var(--mula-card-border, 1px solid #ccc);
        width: 99%;
    }

    .mula-card.optimized-layout .mula-card-header {
        display: none; /* Remove brand title bar */
    }

    .mula-card.optimized-layout .mula-card-image {
        /* Expand hero image prominence */
        max-height: 45vh;
        margin-bottom: 0;
        background-position: top center;
        aspect-ratio: 4/3;
    }

    .mula-card.optimized-layout .mula-card-meta {
        /* Horizontal strip layout for price and rating */
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-top: 1px solid #f0f0f5;
        margin-top: 12px;
    }

    .mula-card.optimized-layout .mula-card-actions {
        display: none; /* Hide footer buttons for optimized layout */
    }

    .mula-inset-view-button {
        width: 100%;
        padding: 12px 16px;
        margin-top: 16px;
        background: #dd6666;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(255, 107, 107, 0.2);
    }

    .mula-inset-view-button:hover {
        background: #bb4444;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
    }

    .mula-inset-view-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(255, 107, 107, 0.2);
    }
    
    .mula-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }
    
    .mula-card-header {
        padding: 12px 16px;
        display: flex;
        align-items: center;
        border-bottom: 1px solid #f0f0f5;
        display: none;
    }
    
    .mula-source-icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #f0f0f5;
        margin-right: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 12px;
        color: #555;
    }
    
    .mula-source-name {
        font-size: 14px;
        font-weight: 500;
        color: #333;
    }
    
    .mula-card-image {
        aspect-ratio: 4/3;
        background-size: contain;
        background-position: center;
        position: relative;
        background-repeat: no-repeat;
        background-color: rgba(
            var(--mula-card-image-bg-r, 238),
            var(--mula-card-image-bg-g, 238),
            var(--mula-card-image-bg-b, 238),
            var(--mula-card-image-bg-opacity, 0.5)
        );
    }
    
    .mula-tag {
        position: absolute;
        top: 12px;
        right: 12px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        font-size: 11px;
        padding: 4px 10px;
        border-radius: 4px;
        font-weight: 500;
    }
    
    .mula-card-content {
        padding: 16px;
        padding-bottom: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
        border-left: 1px solid #eed;
        border-right: 1px solid #eee;
        border-bottom: 1px solid #eee;
        border-bottom-left-radius: 12px;
        border-bottom-right-radius: 12px;
    }
    
    .mula-card-title {
        font-size: 16px;
        font-weight: 600;
        color: #222;
        margin: 0;
        line-height: 1.4;
    }
    
    .mula-card-description {
        font-size: 14px;
        color: #555;
        margin: 0;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    .mula-card-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 8px;
    }
    
    .mula-price {
        font-weight: 600;
        font-size: 18px;
        color: #222;
    }
    
    .mula-original-price {
        font-size: 14px;
        color: #999;
        text-decoration: line-through;
        margin-left: 6px;
    }
    
    .mula-discount {
        font-size: 13px;
        color: #ff3b30;
        font-weight: 500;
    }
    
    .mula-rating {
        display: flex;
        align-items: center;
    }
    
    .mula-stars {
        color: #ff9500;
        font-size: 14px;
        margin-right: 4px;
    }
    
    .mula-reviews {
        font-size: 12px;
        color: #777;
    }
    
    .mula-card-actions {
        display: flex;
        border-top: 1px solid #f0f0f5;
        margin: 0 -16px;
    }
    
    .mula-action-button {
        flex: 1;
        padding: 18px 12px;
        border: none;
        background: transparent;
        font-size: 14px;
        font-weight: 500;
        color: #333;
        cursor: pointer;
        transition: background-color 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
    }
    
    .mula-action-button:hover {
        background-color: #f5f5f7;
    }
    
    .mula-action-button:first-child {
        border-right: 1px solid #f0f0f5;
    }
    
    .mula-action-button svg {
        width: 16px;
        height: 16px;
    }
    
    
    .mula-feed-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding: 0 4px;
    }
    
    .mula-feed-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--mula-feed-title-c,#333);
    }
    
    .mula-feed-subtitle {
        font-size: 14px;
        color: var(--mula-feed-subtitle-c,#777);
        font-weight: 400;
    }
    
    .mula-view-toggle {
        display: flex;
        gap: 4px;
    }
    
    .mula-view-toggle button {
        background: none;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        color: #777;
    }
    
    .mula-view-toggle button.active {
        background: #333;
        color: white;
    }
    
    /* For return to playground button */
    .return-button {
        position: fixed;
        top: 20px;
        left: 20px;
        padding: 8px 16px;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        border-radius: 20px;
        font-family: "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
        z-index: 1000;
        text-decoration: none;
    }
    
    .return-button:hover {
        background-color: rgba(0, 0, 0, 0.8);
        transform: translateY(-1px);
    }
    
    .return-button:active {
        transform: translateY(1px);
    }
    
    /* Core responsive styles */
    @media (max-width: 600px) {
        .container {
            padding: 0 10px;
        }
    }
    
    /* View toggle animation styles */
    .mula-feed.grid-view {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
    }
    
    .mula-feed.list-view {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }
    
    .mula-feed.animating .mula-card {
        opacity: 0;
        transform: scale(0.8);
    }
    
    .mula-feed.animating.grid-view .mula-card,
    .mula-feed.animating.list-view .mula-card {
        animation: cardRearrange 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    
    @keyframes cardRearrange {
        0% {
            opacity: 0;
            transform: scale(0.8);
        }
        100% {
            opacity: 1;
            transform: scale(1);
        }
    }
    
    /* Staggered animation for card appearance */
    .mula-feed.animating .mula-card:nth-child(1) { animation-delay: 0.05s; }
    .mula-feed.animating .mula-card:nth-child(2) { animation-delay: 0.1s; }
    .mula-feed.animating .mula-card:nth-child(3) { animation-delay: 0.15s; }
    .mula-feed.animating .mula-card:nth-child(4) { animation-delay: 0.2s; }
    
    /* Heart icon animation for product likes */
    .mula-heart-button {
        color: #777;
        transition: all 0.3s ease;
    }
    
    .mula-heart-button.active {
        color: #ff3b30;
    }
    
    .mula-heart-button.active svg {
        animation: heartBeat 0.5s ease-in-out;
    }
    
    @keyframes heartBeat {
        0% { transform: scale(1); }
        25% { transform: scale(1.2); }
        50% { transform: scale(1); }
        75% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }
    
    /* Overlay for feed refresh state */
    .mula-feed.refreshing::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(3px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10;
    }
    
    /* Loading indicator with dark glass effect */
    .mula-refresh-indicator {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        background: rgba(40, 40, 45, 0.65);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        padding: 20px 30px;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.08);
        min-width: 220px;
        text-align: center;
    }
    
    .mula-refresh-indicator.active {
        opacity: 1;
    }
    
    .mula-refresh-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-top: 3px solid #fff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
    }
    
    .mula-refresh-text {
        font-size: 15px;
        color: #fff;
        font-weight: 500;
        letter-spacing: 0.5px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* Card shimmer animation for selective content refresh */
    .mula-card {
        position: relative;
    }
    
    .mula-card.shimmer::after {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        border-radius: 12px;
        z-index: 10;
        pointer-events: none;
        overflow: hidden;
    }
    
    .mula-card.shimmer::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.4) 50%,
            rgba(255, 255, 255, 0) 100%
        );
        z-index: 11;
        animation: shimmerOverlayEffect 2s infinite;
        transform: skewX(-20deg);
        pointer-events: none;
        border-radius: 12px;
        overflow: hidden;
    }
    
    @keyframes shimmerOverlayEffect {
        0% { transform: translateX(-150%) skewX(-20deg); }
        100% { transform: translateX(150%) skewX(-20deg); }
    }
    
    /* Notification toast with glass UI effect */
    .mula-notification {
        position: fixed;
        bottom: 130px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: rgba(40, 40, 45, 0.65);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-radius: 16px;
        padding: 14px 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: white;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
        opacity: 0;
        transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 1000;
        max-width: 90%;
        width: 90%;
        box-sizing: border-box;
        text-align: center;
        height: 0;
    }
    
    .mula-notification.active {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
        height: auto;
    }
    
    .mula-notification-icon {
        width: 24px;
        height: 24px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .mula-notification-icon svg {
        width: 14px;
        height: 14px;
        color: #30d158; /* Apple's green success color */
    }
    @media (min-width: 768px) {
        .mula-notification {
            width: unset;
        }
    }
    
    /* Loading indicator styles */
    .mula-loading-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        width: 100%;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .mula-loading-indicator.visible {
        opacity: 1;
    }
    
    .mula-loading-spinner {
        width: 30px;
        height: 30px;
        border: 3px solid rgba(0, 0, 0, 0.1);
        border-top: 3px solid #333;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 10px;
    }
    
    .mula-loading-text {
        font-size: 14px;
        color: #666;
        font-weight: 500;
    }
    
    .mula-load-more-sentinel {
        width: 100%;
        height: 100px;
        visibility: hidden;
    }

    /* Load More Button Styles */
    .mula-load-more-button {
        display: flex;
        justify-content: center;
        padding: 20px 0;
        width: 100%;
        margin: 0 auto;
        position: relative;
        z-index: 30;
        pointer-events: auto;
    }
    .mula-load-more-button button {
        max-width: 90%;
    }

    .mula-load-more-button::before {
        content: '';
        pointer-events: none;
        position: absolute;
        top: -350px; /* Start fade above the button */
        left: 0;
        width: 100%;
        height: 350px; /* Height of the fade overlay */
        background: linear-gradient(to bottom, rgba(255,255,255,0) 0%, #fff 100%);
        pointer-events: none;
        z-index: 2;
    }

    .mula-load-more-button .mula-action-button {
        background: linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%);
        border: 1px solid rgba(255, 107, 107, 0.1);
        border-radius: 12px;
        padding: 14px 28px;
        font-size: 15px;
        font-weight: 500;
        color: #e03131;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-width: 220px;
        box-shadow: 0 2px 8px rgba(255, 107, 107, 0.08);
        position: relative;
        overflow: hidden;
        animation: mulaPulse 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
    }

    .mula-load-more-button .mula-action-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .mula-load-more-button .mula-action-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(255, 107, 107, 0.12);
        background: linear-gradient(135deg, #fff 0%, #ffe3e3 100%);
        color: #c92a2a;
    }

    .mula-load-more-button .mula-action-button:hover::before {
        opacity: 1;
    }

    .mula-load-more-button .mula-action-button:active {
        transform: translateY(1px);
        box-shadow: 0 2px 4px rgba(255, 107, 107, 0.08);
        background: linear-gradient(135deg, #ffe3e3 0%, #ffc9c9 100%);
    }

    @keyframes mulaPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.07); }
        100% { transform: scale(1); }
    }
</style>
<main bind:this={mainEl}>
    <div class="container">
        <div class="mula-widget-15">
            <div class="mula-feed-header">
                <div>
                    <div class="mula-feed-title">Recommended Products</div>
                    <div class="mula-feed-subtitle">Based on this article</div>
                </div>
                <!-- <div class="mula-view-toggle">
                    <button class="active" data-view="list">List</button>
                    <button data-view="grid">Grid</button>
                </div> -->
            </div>
            
            <div class="mula-feed-container">
                <div class="mula-feed" id="productFeed" class:grid-view={isGridView} class:animating={false}>
                    <!-- Product cards will be dynamically inserted here -->
                     <div class="mula-card optimized-layout" style="display: none;" class:shimmer={false}>
                        <div class="mula-card-header">
                            <div class="mula-source-icon"></div>
                            <div class="mula-source-name"></div>
                        </div>
                        <div class="mula-card-image">
                            <div class="mula-tag"></div>
                        </div>
                        <div class="mula-card-content">
                            <h3 class="mula-card-title"></h3>
                            <p class="mula-card-description"></p>
                            <div class="mula-card-meta">
                                <div>
                                    <span class="mula-price"></span>
                                    <span class="mula-original-price"></span>
                                    <div class="mula-discount"></div>
                                </div>
                                <div class="mula-rating">
                                    <div class="mula-stars"></div>
                                    <div class="mula-reviews"></div>
                                </div>
                            </div>
                        </div>
                        <div class="mula-card-actions">
                            <button class="mula-action-button mula-inset-view-button"></button>
                            <button class="mula-action-button mula-view-button">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                View Details
                            </button>
                            <button class="mula-action-button mula-heart-button active">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                            </button>
                        </div>
                     </div>
                </div>
                <div id="loadMoreButton" class="mula-load-more-button" style="display: none;">
                    <button class="mula-action-button">
                        Load More Products
                    </button>
                </div>
            </div>
            
            <!-- Refresh Indicator -->
            <div class="mula-refresh-indicator" id="refreshIndicator" class:active={isRefreshing}>
                <div class="mula-refresh-spinner"></div>
                <div class="mula-refresh-text">Personalizing your curated products⊹ ࣪ ˖</div>
            </div>
            
            <!-- Glass UI Notification -->
            <div class="mula-notification" id="notification" class:active={false}>
                <div class="mula-notification-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <div class="mula-notification-text">Recommendations updated based on your preferences!</div>
            </div>
        </div>
    </div>
</main>
<script>
    let mainEl;
    // State management for liked products
    const likedProducts = new Set();

    import { onMount } from 'svelte';
    import { log, logEvent, setGlobalEventData } from "./Logger";
    import { setupViewTracking, createProductCardViewTracker } from './ViewTracker.js';
    import { getCookie, setCookie, getTopLevelDomain } from './Cookies.js';
    import { simpleHash } from './HashHelpers.js';
    // Experiment imports removed - position_early is now the default behavior when nextPage is enabled


    let isGridView = false;
    let isRefreshing = false;
    let products = [];
    let productFeed;
    let widgetLogParams = {widget: "smartscroll"};
    // Experiment assignment removed - position_early is now the default behavior
    let useLoadMoreButton = false;
    
    // Progressive loading state
    let visibleItems = []; // Now tracks both products and articles
    let currentBatchSize = 6;
    let batchSize = 6;
    let isLoadingMore = false;
    let totalItemsInserted = 0; // Track total items (products + articles) for experiment logic
    let observer;
    let sentinelElement;
    let lastScrollTime = 0;
    let lastScrollPosition = 0;
    let scrollVelocity = 0;
    let preloadTimeout;
    let loadingIndicator;
    let rafId;
    let isScrolling = false;
    let productCardViewTracker; // Product card view tracking controller
    let productCount = 0; // Track products separately from articles
    let feedIterator = null; // Iterator for managing feed items


    /**
     * Feed Iterator Class - Abstracts the complexity of deciding what comes next
     */
    class FeedIterator {
        constructor(products, nextPageArticles, variant, revContentItems = []) {
            this.products = products;
            this.nextPageArticles = nextPageArticles;
            this.variant = variant;
            this.revContentItems = revContentItems;
            this.position = 0;
            this.productIndex = 0;
            this.articleIndex = 0;
            this.revContentItemIndex = 0;
            this.pattern = this._createPattern();
        }

        _createPattern() {
            // Pattern: 1 next page, 3 products, 1 revcontent, repeat
            // Pattern array: ['article', 'product', 'product', 'product', 'revcontent']
            const pattern = [];
            
            // Add article if nextPage articles are available
            if (this.nextPageArticles && this.nextPageArticles.length > 0) {
                pattern.push('article');
            }
            
            // Always add 3 products
            pattern.push('product', 'product', 'product');
            
            // Add revcontent if RevContent items are available
            if (this.revContentItems && this.revContentItems.length > 0) {
                pattern.push('revcontent');
            }
            
            // If no articles or revcontent, just return products
            if (pattern.length === 0) {
                return ['product', 'product', 'product', 'product'];
            }
            
            return pattern;
        }

        nextItem() {
            if (this.position >= this.products.length) {
                return null; // No more items
            }

            const itemType = this.pattern[this.position % this.pattern.length];
            
            if (itemType === 'article') {
                if (this.nextPageArticles.length === 0) {
                    // No articles available, skip to next product
                    return this._getNextProduct();
                }
                return this._getNextArticle();
            } else if (itemType === 'revcontent') {
                if (this.revContentItems.length === 0) {
                    // No RevContent available, skip to next product
                    return this._getNextProduct();
                }
                return this._getNextRevContent();
            } else {
                return this._getNextProduct();
            }
        }

        _getNextProduct() {
            if (this.productIndex >= this.products.length) {
                return null;
            }
            const product = this.products[this.productIndex];
            this.productIndex++;
            this.position++;
            return { type: 'product', data: product };
        }

        _getNextArticle() {
            if (this.nextPageArticles.length === 0) {
                return this._getNextProduct();
            }
            const article = this.nextPageArticles[this.articleIndex % this.nextPageArticles.length];
            this.articleIndex++;
            this.position++;
            return { type: 'article', data: article };
        }

        _getNextRevContent() {
            if (this.revContentItems.length === 0) {
                return this._getNextProduct();
            }
            const revContentItem = this.revContentItems[this.revContentItemIndex % this.revContentItems.length];
            this.revContentItemIndex++;
            this.position++;
            return { type: 'revcontent', data: revContentItem };
        }

        hasNext() {
            return this.position < this.products.length;
        }
    }


    /**
     * Creates a visual star rating based on numeric value
     * @param {number} rating - Rating value (0-5)
     * @return {string} HTML string with star characters
     */
    function createStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let starsHTML = '';
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '★';
        }
        if (hasHalfStar) {
            starsHTML += '★';
        }
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '☆';
        }
        
        return starsHTML;
    }
    
    /**
     * Computes the discount percentage between current and original price
     * @param {string} currentPrice - Current price with currency symbol (e.g., "$39.99")
     * @param {string} originalPrice - Original price with currency symbol (e.g., "$59.99")
     * @returns {string} Discount percentage with "off" suffix (e.g., "33% off")
     */
    function computeDiscount(currentPrice, originalPrice) {
        if (!currentPrice || !originalPrice) return '';
        
        // Remove currency symbols and convert to numbers
        const current = parseFloat(currentPrice.toString().replace(/[^0-9.-]+/g, ''));
        const original = parseFloat(originalPrice.toString().replace(/[^0-9.-]+/g, ''));
        
        if (isNaN(current) || isNaN(original) || original <= current) return '';
        
        const discount = Math.round(((original - current) / original) * 100);
        return `${discount}% off`;
    }
    
    /**
     * Formats a number as USD currency string
     * @param {number} price - The price to format
     * @returns {string} Formatted price with $ symbol and 2 decimal places
     */
    function formatPrice(price) {
        if (typeof price !== 'number' || isNaN(price)) return '';
        return `$${price.toFixed(2)}`;
    }
    
    /**
     * Extracts first letter of domain for source icon
     * @param {string} source - Domain name (e.g., "example.com")
     * @return {string} Uppercase first letter
     */
    function getSourceInitial(source) {
        return source.charAt(0).toUpperCase();
    }
    
    const getPostImage = (item) => {
        return item?.thumbnails?.[0] || item?.thumbnail?.static || item?.thumbnail;
    }
    let loadMoreClicks = 0;
    onMount(() => {
        mainEl.addEventListener('focus', () => {
            mainEl.blur();
        });

        // Experiment concluded: position_early is now the default behavior when nextPage is enabled
        // No A/B test logic needed - FeedIterator will use position_early pattern automatically

        // Main product feed container reference
        productFeed = mainEl.querySelector('#productFeed');
        
        
        // Set up view tracking
        setupViewTracking(mainEl, widgetLogParams);
        
        // Initialize product card view tracker
        productCardViewTracker = createProductCardViewTracker({
            threshold: 0.1,
            rootMargin: '50px 0px',
            disconnectAfterView: true,
            widgetLogParams
        });
        let feedLength = 40;
        // Initialize products from window.Mula.feed with potential organic config
        if (window.Mula.organicConfig?.smartScroll) {
            const configArray = window.Mula.organicConfig?.smartScroll;
            
            // Randomly select a config from the array
            const selectedConfig = configArray[Math.floor(Math.random() * configArray.length)];
            
            // Take only the specified number of items from the feed, or all items if feedLength is larger
            feedLength = selectedConfig.feedLength;
            useLoadMoreButton = !!selectedConfig.loadMoreButton;
        }
        setGlobalEventData('feedLength', feedLength);
        products = [...window.Mula.feed].slice(0, Math.min(feedLength, window.Mula.feed.length));
        logEvent("mula_widget_view", "smartscroll", {...widgetLogParams});
        // Set up intersection observer for infinite scroll only if not using load more button
        if (!useLoadMoreButton) {
            setupIntersectionObserver();
        } else {
            // Show load more button if enabled
            const loadMoreButton = mainEl.querySelector('#loadMoreButton');
            if (loadMoreButton) {
                loadMoreButton.style.display = 'flex';
                loadMoreButton.querySelector('button').addEventListener('click', (e) => {
                    e.stopPropagation();
                    loadMoreClicks += 1;
                    logEvent("load_more_button_clicked", loadMoreClicks, {...widgetLogParams});
                    document.querySelector("mula-smartscroll").blur();
                    loadNextBatch(batchSize);
                });
            }
        }
        
        // Set up scroll velocity tracking
        setupScrollTracking();
        
        // Initialize iterator with RevContent items from BootLoader
        // RevContent is loaded in BootLoader and available on window.Mula.revContentItems
        const nextPageArticles = window.Mula.nextPage || [];
        const revContentItems = window.Mula.revContentItems || [];
        feedIterator = new FeedIterator(products, nextPageArticles, null, revContentItems);
        
        if (revContentItems.length > 0) {
            log(`RevContent items available: ${revContentItems.length}`);
        }
        
        // Initial render of first batch
        loadNextBatch();
        
        return () => {
            // Cleanup
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            if (preloadTimeout) {
                clearTimeout(preloadTimeout);
            }
            window.removeEventListener('scroll', handleScroll, { passive: true });
            if (observer) {
                observer.disconnect();
            }
            // Cleanup ad view observers
            adViewObservers.forEach(observer => observer.disconnect());
            adViewObservers.clear();
            
            // Cleanup product card view tracker
            if (productCardViewTracker) {
                productCardViewTracker.disconnect();
            }
        };
    });

    function setupScrollTracking() {
        // Use requestAnimationFrame for scroll handling
        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    function handleScroll() {
        if (!isScrolling) {
            isScrolling = true;
            rafId = requestAnimationFrame(updateScroll);
        }
    }

    function updateScroll() {
        const currentTime = Date.now();
        const currentPosition = window.scrollY;
        
        // Calculate scroll velocity (pixels per millisecond)
        if (lastScrollTime && !useLoadMoreButton) {
            const timeDiff = currentTime - lastScrollTime;
            const positionDiff = currentPosition - lastScrollPosition;
            scrollVelocity = Math.abs(positionDiff / timeDiff);
            
            // Only trigger preload if scrolling fast enough and near the bottom
            if (scrollVelocity > 0.3) { // Increased threshold for scroll velocity
                const scrollBottom = window.innerHeight + window.scrollY;
                const documentHeight = document.documentElement.scrollHeight;
                const distanceFromBottom = documentHeight - scrollBottom;
                
                // Only preload if we're within 500px of the bottom
                if (distanceFromBottom < 500) {
                    // Clear any existing preload timeout
                    if (preloadTimeout) {
                        clearTimeout(preloadTimeout);
                    }
                    
                    // Schedule preload with velocity-based delay
                    preloadTimeout = setTimeout(() => {
                        if (!isLoadingMore && feedIterator && feedIterator.hasNext()) {
                            preloadNextBatch();
                        }
                    }, Math.max(0, 200 - (scrollVelocity * 1000))); // Increased minimum delay
                }
            }
        }
        
        lastScrollTime = currentTime;
        lastScrollPosition = currentPosition;
        isScrolling = false;
    }

    function setupIntersectionObserver() {
        // Create a sentinel element for observing
        sentinelElement = document.createElement('div');
        sentinelElement.className = 'mula-load-more-sentinel';
        sentinelElement.style.height = '100px';
        productFeed.appendChild(sentinelElement);

        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !isLoadingMore && feedIterator && feedIterator.hasNext()) {
                    log("calling loadNextBatch");
                    loadNextBatch(batchSize);
                }
            });
        }, {
            root: null,
            rootMargin: '200px', // Reduced from 300px
            threshold: 0.1
        });

        observer.observe(sentinelElement);
    }

    function loadNextBatch(size = batchSize) {
        if (isLoadingMore || !feedIterator || !feedIterator.hasNext()) return;
        
        isLoadingMore = true;
        
        // Get next batch of items from iterator
        const newItems = [];
        let itemsAdded = 0;
        
        while (feedIterator.hasNext() && itemsAdded < size) {
            const item = feedIterator.nextItem();
            if (item) {
                newItems.push(item);
                itemsAdded++;
            }
        }
        
        // Only show loading indicator if we're falling behind
        if (scrollVelocity > 0.5) {
            loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'mula-loading-indicator';
            loadingIndicator.innerHTML = `
                <div class="mula-loading-spinner"></div>
                <div class="mula-loading-text">Loading more products...</div>
            `;
            productFeed.insertBefore(loadingIndicator, sentinelElement);
        }
        
        // Store current scroll position and container height
        const container = mainEl.querySelector('.mula-feed-container');
        const currentScroll = window.scrollY;
        const containerTop = container.getBoundingClientRect().top;
        const viewportHeight = window.innerHeight;
        
        // Use requestAnimationFrame for smoother rendering
        requestAnimationFrame(() => {
            // Add new items to visible items
            visibleItems = [...visibleItems, ...newItems];
            
            // Remove loading indicator if it exists
            if (loadingIndicator) {
                loadingIndicator.remove();
                loadingIndicator = null;
            }
            
            // Render the new batch of items
            renderItems(newItems);
            
            // Calculate new container height
            const newContainerHeight = container.scrollHeight;
            const heightDiff = newContainerHeight - container.scrollHeight;
            
            // Only adjust scroll if we're near the bottom
            const scrollBottom = viewportHeight + currentScroll;
            const documentHeight = document.documentElement.scrollHeight;
            const distanceFromBottom = documentHeight - scrollBottom;
            
            if (distanceFromBottom < 500) {
                // Use requestAnimationFrame to ensure smooth scroll restoration
                requestAnimationFrame(() => {
                    // Calculate the new scroll position that maintains the same viewport content
                    const newScroll = currentScroll + heightDiff;
                    window.scrollTo({
                        top: newScroll,
                        behavior: 'instant'
                    });
                });
            }
            
            isLoadingMore = false;
            
            // Hide load more button if we've loaded all items
            if (useLoadMoreButton && !feedIterator.hasNext()) {
                const loadMoreButton = mainEl.querySelector('#loadMoreButton');
                if (loadMoreButton) {
                    loadMoreButton.style.display = 'none';
                }
            }
            
            // Only preload next batch if scrolling very fast and not using load more button
            if (!useLoadMoreButton && scrollVelocity > 0.85) {
                log("preloading next batch", {scrollVelocity});
                preloadNextBatch();
            }
        });
    }

    function preloadNextBatch() {
        if (isLoadingMore || !feedIterator || !feedIterator.hasNext()) return;
        
        // Store current scroll position and container height
        const container = mainEl.querySelector('.mula-feed-container');
        const currentScroll = window.scrollY;
        const containerTop = container.getBoundingClientRect().top;
        const viewportHeight = window.innerHeight;
        
        // Get next batch of items from iterator
        const newItems = [];
        let itemsAdded = 0;
        
        while (feedIterator.hasNext() && itemsAdded < batchSize) {
            const item = feedIterator.nextItem();
            if (item) {
                newItems.push(item);
                itemsAdded++;
            }
        }
        
        // Add new items to visible items
        visibleItems = [...visibleItems, ...newItems];
        
        // Render the new batch of items
        renderItems(newItems);
        
        // Calculate new container height
        const newContainerHeight = container.scrollHeight;
        const heightDiff = newContainerHeight - container.scrollHeight;
        
        // Only adjust scroll if we're near the bottom
        const scrollBottom = viewportHeight + currentScroll;
        const documentHeight = document.documentElement.scrollHeight;
        const distanceFromBottom = documentHeight - scrollBottom;
        
        if (distanceFromBottom < 500) {
            // Use requestAnimationFrame to ensure smooth scroll restoration
            requestAnimationFrame(() => {
                // Calculate the new scroll position that maintains the same viewport content
                const newScroll = currentScroll + heightDiff;
                window.scrollTo({
                    top: newScroll,
                    behavior: 'instant'
                });
            });
        }
    }


    function renderItems(items) {
        // Simple type-based renderer
        items.forEach(item => {
            if (item.type === 'product') {
                renderProductCard(item.data);
            } else if (item.type === 'article') {
                renderArticleCard(item.data);
            } else if (item.type === 'revcontent') {
                renderRevContentCard(item.data);
            }
            totalItemsInserted++;
        });
    }
    
    function renderProductCard(product) {
        
        // Create product card
        const card = document.createElement('div');
        card.className = 'mula-card';
        card.dataset.itemType = 'product';
        card.dataset.itemId = product.id;
        // Keep productId for backward compatibility with existing code
        card.dataset.productId = product.id;
        
        
        // Preserve liked state for each product
        const isLiked = likedProducts.has(product.id);
        
        card.innerHTML = `
            <div class="mula-card-header">
                <div class="mula-source-icon">${getSourceInitial(product.source)}</div>
                <div class="mula-source-name">${product.source}</div>
            </div>
            <div class="mula-card-image" style="background-image: url('${getPostImage(product)}')">
                <div class="mula-tag" style="${product.tag ? "" : "display:none;"}">${product.tag}</div>
            </div>
            <div class="mula-card-content">
                <h3 class="mula-card-title">${product.title}</h3>
                <p class="mula-card-description">${product.description}</p>
                <div class="mula-card-meta">
                    <div>
                        <span class="mula-price">${product.price}</span>
                        <span class="mula-original-price" style="${product.extracted_old_price ? "" : "display:none;"}">${formatPrice(product.extracted_old_price)}</span>
                        <div class="mula-discount" style="${product.extracted_old_price ? "" : "display:none;"}">${computeDiscount(product.price, product.extracted_old_price)}</div>
                    </div>
                    <div class="mula-rating">
                        <div class="mula-stars" style="${product.rating ? "" : "display:none;"}">${createStarRating(product.rating)}</div>
                        <div class="mula-reviews" style="${product.reviews ? "" : "display:none;"}">(${product.reviews})</div>
                    </div>
                </div>
                <div class="mula-card-actions">
                    <button class="mula-action-button mula-view-button">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View Details
                    </button>
                    <button class="mula-action-button mula-heart-button ${isLiked ? 'active' : ''}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        ${isLiked ? 'Liked' : 'Like'}
                    </button>
                </div>
            </div>
        `;
        
        productFeed.insertBefore(card, sentinelElement);
        
        // Add event handlers for card interactions
        setupCardEventListeners(card, product);
        
        // Add card to view tracking
        if (productCardViewTracker) {
            productCardViewTracker.observe(card);
        }
        
        // Increment counters
        productCount++;
        totalItemsInserted++;
    }
    
    function renderArticleCard(article) {
        // Create next-page card element
        const nextPageCard = document.createElement('div');
        nextPageCard.className = 'mula-card mula-next-page-card';
        nextPageCard.dataset.itemType = 'nextpage';
        // Hash the URL pathname for consistent identification (matches BootLoader pattern)
        try {
            const articleUrl = new URL(article.url);
            nextPageCard.dataset.itemId = simpleHash(articleUrl.pathname);
        } catch (error) {
            // Fallback to hashing the full URL if parsing fails
            nextPageCard.dataset.itemId = simpleHash(article.url);
        }
        nextPageCard.style.cssText = `
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            display: flex;
            flex-direction: column;
            width: 100%;
            position: relative;
            transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            margin-bottom: 24px;
            cursor: pointer;
        `;
        
        nextPageCard.innerHTML = `
            <div style="
                aspect-ratio: 4/3;
                background-image: url('${article.imageUrl}');
                background-size: cover;
                background-position: center;
                position: relative;
            ">
                <div class="mula-tag">Article</div>
            </div>
            <div style="padding: 16px;">
                <h3 style="
                    font-size: 16px;
                    font-weight: 600;
                    color: #1d1d1f;
                    margin: 0 0 8px 0;
                    line-height: 1.3;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                ">${article.title}</h3>
                <div style="
                    display: flex;
                    align-items: center;
                    color: #666;
                    font-size: 14px;
                    margin-top: 8px;
                ">
                    <span>Read More</span>
                    <svg style="margin-left: 4px; width: 14px; height: 14px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </div>
            </div>
        `;
        
        // Add click handler for next-page item
        nextPageCard.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Track visited next page article
            try {
                const visitedArticles = JSON.parse(localStorage.getItem('mula_visited_articles') || '[]');
                if (!visitedArticles.includes(article.url)) {
                    visitedArticles.push(article.url);
                    localStorage.setItem('mula_visited_articles', JSON.stringify(visitedArticles));
                }
            } catch (error) {
                console.warn('Failed to track visited article:', error);
            }
            
            // Add UTM parameters to URL
            const url = new URL(article.url, window.location.origin);
            url.searchParams.set('utm_source', 'mula');
            url.searchParams.set('utm_campaign', 'next_page');
            url.searchParams.set('utm_medium', 'smartscroll');
            
            // Log click event
            logEvent('mula_next_page_click', url.toString(), {...widgetLogParams});
            
            // Open in new tab
            window.open(url.toString(), '_blank');
        });
        
        // Insert the next-page card
        productFeed.insertBefore(nextPageCard, sentinelElement);
        
        // Add card to view tracking
        if (productCardViewTracker) {
            productCardViewTracker.observe(nextPageCard);
        }
        
        // Increment total items count for the article
        totalItemsInserted++;
        
        log(`Next-page item inserted: ${article.title}`);
    }
    
    /**
     * Renders a RevContent sponsored content card
     * @param {Object} revContentItem - RevContent item data from API
     */
    function renderRevContentCard(revContentItem) {
        // Create RevContent card element (matching next page card style)
        const card = document.createElement('div');
        card.className = 'mula-card mula-revcontent-card';
        card.dataset.itemType = 'revcontent';
        card.dataset.itemId = revContentItem.uid;
        // Keep revcontentUid for backward compatibility
        card.dataset.revcontentUid = revContentItem.uid;
        card.style.cssText = `
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            display: flex;
            flex-direction: column;
            width: 100%;
            position: relative;
            transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            margin-bottom: 24px;
            cursor: pointer;
        `;
        
        card.innerHTML = `
            <div style="
                aspect-ratio: 4/3;
                background-image: url('${revContentItem.image}');
                background-size: cover;
                background-position: center;
                position: relative;
            ">
                <div class="mula-tag">Sponsored</div>
            </div>
            <div style="padding: 16px;">
                <h3 style="
                    font-size: 16px;
                    font-weight: 600;
                    color: #1d1d1f;
                    margin: 0 0 8px 0;
                    line-height: 1.3;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                ">${revContentItem.headline}</h3>
                <div style="
                    display: flex;
                    align-items: center;
                    color: #666;
                    font-size: 14px;
                    margin-top: 8px;
                ">
                    <span>Read More</span>
                    <svg style="margin-left: 4px; width: 14px; height: 14px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </div>
            </div>
        `;
        
        // Add click handler for entire RevContent card
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            logEvent("mula_rev_content_click", revContentItem.uid, {
                ...widgetLogParams,
                revcontent_uid: revContentItem.uid,
                card_type: 'revcontent'
            });
            log(`RevContent clicked: ${revContentItem.headline}`);
            // Open target URL in new tab
            window.open(revContentItem.target_url, '_blank');
        });
        
        // Insert card into feed
        productFeed.insertBefore(card, sentinelElement);
        
        // Add card to view tracking
        if (productCardViewTracker) {
            productCardViewTracker.observe(card);
        }
        
        // Increment counters
        totalItemsInserted++;
        
        log(`RevContent card inserted: ${revContentItem.headline}`);
    }
    
    /**
     * Attaches event listeners to product card elements
     * @param {HTMLElement} card - Card element to attach listeners to
     * @param {Object} product - Product data associated with the card
     */
    function setupCardEventListeners(card, product) {
        const handleViewDetails = (e) => {
            e.stopPropagation();
            logEvent("mula_store_click", product.product_id, {...widgetLogParams});
            log(`View details for ${product.title}`);
            window.Mula.openMulaLink(product.stores[0].link, product.product_id);
        };
        
        // Handle View Details button
        const viewButton = card.querySelector('.mula-view-button');
        if (viewButton) {
            viewButton.addEventListener('click', handleViewDetails);
        }
        
        // Image click always opens product details regardless of variant
        const image = card.querySelector('.mula-card-image');
        image.addEventListener('click', (e) => {
            e.stopPropagation();
            logEvent("mula_store_click", product.product_id, {...widgetLogParams});
            log(`Image clicked for ${product.title}`);
            window.Mula.openMulaLink(product.stores[0].link, product.product_id);
        });
        
        // Like button with heart icon (if present)
        const heartButton = card.querySelector('.mula-heart-button');
        if (heartButton) {
            heartButton.addEventListener('click', e => {
                e.stopPropagation();
                if (heartButton.classList.contains('active')) {
                    logEvent("mula_unlike_click", product.product_id, {...widgetLogParams});
                    // Unlike product
                    heartButton.classList.remove('active');
                    heartButton.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        Like
                    `;
                    log(`Unliked ${product.title}`);
                    
                    likedProducts.delete(product.id);
                } else {
                    logEvent("mula_like_click", product.product_id, {...widgetLogParams});
                    // Like product
                    heartButton.classList.add('active');
                    heartButton.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        Liked
                    `;
                    log(`Liked ${product.title}`);
                    
                    likedProducts.add(product.id);
                    
                    // Personalize recommendations based on liked product
                    simulateRefresh(product.id);
                }
            });
        }
        // Entire card click for details view
        card.addEventListener('click', e => {
            if (!e.target.closest('.mula-action-button')) {
                log(`Clicked on ${product.title} card`);
                window.Mula.openMulaLink(product.stores[0].link, product.product_id);
            }
        });
    }
    
    /**
     * Simulates refreshing recommendations based on user interactions
     * Applies animations to cards being updated and shows loading indicators
     * @param {number} likedProductId - ID of the product that was liked
     */
    function simulateRefresh(likedProductId) {
        const refreshIndicator = mainEl.querySelector('#refreshIndicator');
        const notification = mainEl.querySelector('#notification');
        
        // Show refresh indicator
        refreshIndicator.classList.add('active');
        
        // Get all cards and find the liked card's position
        const allCards = mainEl.querySelectorAll('.mula-card');
        let likedCardIndex = -1;
        
        allCards.forEach((card, index) => {
            if (parseInt(card.dataset.productId) === parseInt(likedProductId)) {
                likedCardIndex = index;
            }
        });

        // Apply shimmer effect only to cards after the liked card
        if (likedCardIndex >= 0) {
            // Clear any existing shimmer effects
            allCards.forEach(card => card.classList.remove('shimmer'));
            
            // Add shimmer only to cards that will be refreshed
            allCards.forEach((card, index) => {
                if (index > likedCardIndex) {
                    card.classList.add('shimmer');
                }
            });
        }

        // Simulate API delay for personalization processing
        setTimeout(() => {
            // Available product recommendations for personalization
            // const newProducts = [
            //     {
            //         id: 5,
            //         title: "Premium Wool Beanie",
            //         brand: "North Face",
            //         price: "$39.99",
            //         originalPrice: "$59.99",
            //         discount: "33% off",
            //         rating: 4.9,
            //         reviews: 211,
            //         image: "https://placehold.co/600x400/f8f9fa/495057?text=Premium+Beanie",
            //         tag: "Similar Style",
            //         source: "northface.com",
            //         description: "Ultra-soft premium wool beanie with thermal lining for maximum warmth in cold conditions."
            //     },
            //     {
            //         id: 6,
            //         title: "Thermal Neck Warmer",
            //         brand: "Columbia",
            //         price: "$24.99",
            //         originalPrice: "$34.99",
            //         discount: "29% off",
            //         rating: 4.7,
            //         reviews: 183,
            //         image: "https://placehold.co/600x400/f8f9fa/495057?text=Thermal+Neck+Warmer",
            //         tag: "Recommended",
            //         source: "columbia.com",
            //         description: "Versatile thermal neck warmer that can be worn in multiple ways for protection against the elements."
            //     },
            //     {
            //         id: 7,
            //         title: "Merino Wool Socks",
            //         brand: "SmartWool",
            //         price: "$21.99",
            //         originalPrice: "$29.99",
            //         discount: "27% off",
            //         rating: 4.8,
            //         reviews: 247,
            //         image: "https://placehold.co/600x400/f8f9fa/495057?text=Merino+Wool+Socks",
            //         tag: "Based on Likes",
            //         source: "smartwool.com",
            //         description: "Premium merino wool socks that provide exceptional comfort and moisture-wicking properties for all-day wear."
            //     },
            //     {
            //         id: 8,
            //         title: "Leather Touchscreen Gloves",
            //         brand: "UGG",
            //         price: "$79.99",
            //         originalPrice: "$110.00",
            //         discount: "27% off",
            //         rating: 4.6,
            //         reviews: 168,
            //         image: "https://placehold.co/600x400/f8f9fa/495057?text=Touchscreen+Gloves",
            //         tag: "Premium Pick",
            //         source: "ugg.com",
            //         description: "Luxurious leather gloves with touchscreen capability, allowing you to use your devices without removing them."
            //     },
            //     {
            //         id: 9,
            //         title: "Waterproof Winter Hat",
            //         brand: "Outdoor Research",
            //         price: "$45.99",
            //         originalPrice: "$65.00",
            //         discount: "29% off",
            //         rating: 4.7,
            //         reviews: 132,
            //         image: "https://placehold.co/600x400/f8f9fa/495057?text=Waterproof+Hat",
            //         tag: "Weather Resistant",
            //         source: "outdoorresearch.com",
            //         description: "Technical winter hat with waterproof exterior and thermal lining to keep you warm and dry in harsh conditions."
            //     },
            //     {
            //         id: 10,
            //         title: "Cashmere-lined Mittens",
            //         brand: "Burberry",
            //         price: "$125.00",
            //         originalPrice: "$175.00",
            //         discount: "29% off",
            //         rating: 4.9,
            //         reviews: 87,
            //         image: "https://placehold.co/600x400/f8f9fa/495057?text=Cashmere+Mittens",
            //         tag: "Luxury Item",
            //         source: "burberry.com",
            //         description: "Elegant wool mittens with ultra-soft cashmere lining for the ultimate combination of warmth and luxury."
            //     },
            //     {
            //         id: 11,
            //         title: "Heated Ski Socks",
            //         brand: "Hotronic",
            //         price: "$89.99",
            //         originalPrice: "$129.99",
            //         discount: "31% off",
            //         rating: 4.6,
            //         reviews: 142,
            //         image: "https://placehold.co/600x400/f8f9fa/495057?text=Heated+Socks",
            //         tag: "Tech Innovation",
            //         source: "hotronic.com",
            //         description: "Battery-powered heated socks that provide up to 8 hours of continuous warmth for winter sports and outdoor activities."
            //     }
            // ];
            
            // Refresh products after the liked card
            if (likedCardIndex !== -1 && likedCardIndex < products.length - 1) {
                // Preserve products up to and including the liked card
                const productsBeforeLiked = products.slice(0, likedCardIndex + 1);
                
                // Determine which products need to be replaced
                const productsToReplace = products.slice(likedCardIndex + 1);
                const numToReplace = productsToReplace.length;
                
                // Select personalized products without repetition
                const selectedNewProducts = [];
                const newProducts = shuffleArray(productsToReplace);
                const availableIndices = Array.from(Array(newProducts.length).keys());
                
                // Randomly select products from the recommendations pool
                for (let i = 0; i < numToReplace; i++) {
                    if (availableIndices.length === 0) break;
                    
                    const randomIndex = Math.floor(Math.random() * availableIndices.length);
                    const productIndex = availableIndices[randomIndex];
                    
                    availableIndices.splice(randomIndex, 1);
                    selectedNewProducts.push(newProducts[productIndex]);
                }
                
                // Update product array with personalized recommendations
                products.length = 0;
                products.push(...productsBeforeLiked, ...selectedNewProducts);
            }
            
            // Complete refresh process after loading delay
            setTimeout(() => {
                refreshIndicator.classList.remove('active');
                
                // Remove shimmer effects
                allCards.forEach(card => {
                    card.classList.remove('shimmer');
                });
                
                // Recreate iterator with updated products and re-render
                const nextPageArticles = window.Mula.nextPage || [];
                feedIterator = new FeedIterator(products, nextPageArticles, null);
                
                // Clear existing items and re-render from beginning
                visibleItems = [];
                totalItemsInserted = 0; // Reset counter
                const existingCards = productFeed.querySelectorAll('.mula-card:not(.mula-load-more-sentinel)');
                existingCards.forEach(card => card.remove());
                
                // Load initial batch
                loadNextBatch(batchSize);
                
                // Animate new cards with staggered entrance
                setTimeout(() => {
                    const updatedCards = mainEl.querySelectorAll('.mula-card');
                    updatedCards.forEach((card, index) => {
                        if (index > likedCardIndex) {
                            // Start with invisible cards
                            card.style.opacity = '0';
                            card.style.transform = 'translateY(20px)';
                            
                            // Stagger animation timing for natural flow
                            setTimeout(() => {
                                card.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                                card.style.opacity = '1';
                                card.style.transform = 'translateY(0)';
                            }, 100 + (index - likedCardIndex) * 100);
                        }
                    });
                    
                    // Show success notification
                    notification.classList.add('active');
                    
                    // Auto-dismiss notification after delay
                    setTimeout(() => {
                        notification.classList.remove('active');
                    }, 4000);
                }, 100);
            }, 2000);
        }, 1000);
    }

    function showModal(product) {
        if (productModal) {
            productModal.show(product);
        }
    }

    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

</script>