<svelte:options tag="mula-topshelf" />
<style>
    main {
        font-family: var(--mula-font-family);
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    ul {
        margin: 0;
        padding: 0;
    }
    h1 {
        margin-bottom: 30px;
        text-align: center;
    }
    
    .container {
        max-width: 100%;
        width: 100%;
        padding: 10px;
    }
    
    /* Widget 7 - Sticky Inline Carousel */
    .mula-widget-7 {
        position: relative;
        width: 100%;
        margin: 25px 0;
        font-family: var(--mula-font-family);
        border-radius: 16px;
        overflow: hidden;
        border: var(--mula-topshelf-border, none);
    }
    
    .mula-sticky-carousel {
        background: var(--mula-bg);
        border-radius: 14px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        margin: 0 auto;
        max-width: 100%;
        position: relative;
    }
    
    .mula-sticky-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 15px 10px;
        border-bottom: 1px solid var(--mula-border);
        position: relative;
    }
    
    .mula-sticky-title {
        color: var(--mula-text);
        font-size: 17px;
        font-weight: 400;
        letter-spacing: -0.02em;
        position: relative;
        z-index: 1;
        text-shadow: 0 0 1px rgba(255,255,255,0.5);
        animation: strokePulse 3s ease-in-out infinite;
    }
    
    @keyframes strokePulse {
        0% { text-shadow: 0 0 1px rgba(255,255,255,0.3); }
        50% { text-shadow: 0 0 2px rgba(255,255,255,0.9), 0 0 4px rgba(255,255,255,0.4); }
        100% { text-shadow: 0 0 1px rgba(255,255,255,0.3); }
    }
    
    .mula-sticky-subtitle {
        color: var(--mula-text-secondary);
        font-size: 11px;
        font-weight: 400;
        letter-spacing: 0.02em;
        margin-top: 2px;
    }
    
    .mula-sticky-track-container {
        position: relative;
        overflow: hidden;
        width: calc(100% + 60px);  /* Wider to show partial 4th card */
        margin-right: -60px;
    }
    
    .arrows-container {
        display: flex;
        gap: 6px;
        position: absolute;
        right: 15px;
        top: 14px;
        z-index: 10;
    }
    
    .scroll-indicator {
        width: 28px;
        height: 28px;
        background: var(--mula-scroll-indicator-bg);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 1;
        transition: all 0.2s ease;
        box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        border: 1px solid var(--mula-border);
    }
    
    .scroll-indicator:hover {
        opacity: 1;
        transform: scale(1.03);
        background: var(--mula-scroll-indicator-hover);
    }
    
    .scroll-indicator:active {
        transform: scale(0.96);
        background: var(--mula-scroll-indicator-active);
    }
    
    .scroll-indicator svg {
        width: 13px;
        height: 13px;
        fill: var(--mula-text);
    }
    
    /* Right arrow animation - subtle pulse instead of movement */
    .scroll-indicator.right {
        animation: subtlePulse 2s ease-in-out infinite;
    }
    
    @keyframes subtlePulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.08); }
    }
    
    .scroll-indicator.right.user-interacted {
        animation: none;
    }
    
    .scroll-hint {
        position: absolute;
        right: 15px;
        top: 50%;
        transform: translateY(-50%);
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulseHint 2s infinite;
        pointer-events: none;
        z-index: 5;
        opacity: 0.8;
    }
    
    @keyframes pulseHint {
        0% { transform: translateY(-50%) translateX(0); opacity: 0.8; }
        50% { transform: translateY(-50%) translateX(-10px); opacity: 1; }
        100% { transform: translateY(-50%) translateX(0); opacity: 0.8; }
    }
    
    .scroll-hint svg {
        width: 12px;
        height: 12px;
        fill: white;
    }
    
    .mula-sticky-track {
        overflow-x: auto;
        padding: 15px;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
        display: flex;
        gap: 15px;
        min-height: 200px;
        position: relative;
        scroll-behavior: smooth;
        /* touch-action: pan-x; */
        cursor: grab;
        perspective: 1000px;
    }
    
    .mula-sticky-track:active {
        cursor: grabbing;
    }
    
    .mula-sticky-track::-webkit-scrollbar {
        display: none;
    }
    
    .mula-sticky-card {
        flex: 0 0 auto;
        width: 150px;
        background: transparent;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--mula-border);
        position: relative;
        transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
        display: flex;
        flex-direction: column;
        cursor: pointer;
        transform-style: preserve-3d;
        will-change: transform;
        transform: translateZ(0);
    }
    
    .mula-sticky-card:hover {
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25);
        transform: scale(1.02);
        border: 1px solid var(--mula-border-hover);
    }
    
    .mula-sticky-card:active {
        transform: scale(0.98);  /* Removed translateY(0) to prevent vertical movement */
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        transition: all 0.1s cubic-bezier(0.19, 1, 0.22, 1);
    }
    
    .mula-sticky-card.tapped {
        animation: cardRelease 0.5s cubic-bezier(0.19, 1, 0.22, 1);
    }
    
    @keyframes cardRelease {
        0% { transform: scale(0.98); }
        40% { transform: scale(1.03); }
        100% { transform: scale(1.02); }
    }
    
    .mula-sticky-image {
        height: 150px;
        background-size: cover;
        background-position: center;
        position: relative;
        transition: all 0.3s ease;
        border: none;
    }
    
    /* Image overlay gradient */
    .mula-sticky-image::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 70%;
        background: linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%);
        z-index: 1;
    }
    
    /* Add perimeter glow effect on hover - replace with animated border */
    .mula-sticky-card::before {
        display: none; /* Remove the border animation element */
    }
    
    .mula-sticky-card:hover::before {
        animation: none;
        opacity: 0;
    }
    
    /* Configure 3D tilt effect */
    .mula-sticky-track {
        perspective: 1000px;
    }
    
    .mula-sticky-card {
        flex: 0 0 auto;
        width: 150px;
        background: transparent;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--mula-border);
        position: relative;
        transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
        display: flex;
        flex-direction: column;
        cursor: pointer;
        transform-style: preserve-3d;
        will-change: transform;
        transform: translateZ(0);
    }
    
    .mula-sticky-card:hover {
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25);
        transform: scale(1.02);
        border: 1px solid var(--mula-border-hover);
    }
    
    .mula-sticky-label {
        position: absolute;
        top: 10px;
        left: 10px;
        background: rgba(0, 0, 0, 0.5);
        color: rgba(255, 255, 255, 0.9);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 400;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        z-index: 2;
    }
    
    /* Image caption text */
    .mula-sticky-caption {
        display: none;
    }
    
    .mula-like-button {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--mula-like-button-bg);
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        z-index: 2;
    }
    
    .mula-like-button svg {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
        fill: var(--mula-like-fill);
        stroke: var(--mula-like-stroke);
        stroke-width: 1.5;
        transition: all 0.3s ease;
    }
    
    .mula-like-button.active {
        background: var(--mula-like-button-active);
    }
    
    .mula-like-button.active svg {
        fill: white;
    }
    
    .mula-sticky-info {
        padding: 14px 12px 12px;
        flex-grow: 1;
        background-color: var(--mula-bg);
    }
    
    .mula-sticky-name {
        color: var(--mula-text);
        font-size: 12px;
        font-weight: 400;
        margin-bottom: 2px;
        line-height: 1.3;
        letter-spacing: -0.01em;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .mula-sticky-price {
        color: var(--mula-text-secondary);
        font-size: 12px;
        font-weight: 400;
        letter-spacing: 0.02em;
    }
    
    .mula-buy-button {
        background: var(--mula-buy-button-bg);
        color: var(--mula-text);
        font-size: 12px;
        font-weight: 400;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        padding: 10px 0;
        width: 100%;
        text-align: center;
        border: none;
        cursor: pointer;
        transition: all 0.15s ease;
        overflow: hidden;
        position: relative;
        border-radius: 0 0 12px 12px;
        border-top: 1px solid var(--mula-border);
    }
    
    .mula-buy-button:hover {
        background: var(--mula-buy-button-hover);
        color: var(--mula-text);
        opacity: 0.9;
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
    }
    
    .mula-buy-button:active {
        transform: scale(0.98);
        opacity: 1;
    }
    
    /* Remove ripple animation for BUY button */
    .mula-buy-button::after {
        display: none;
    }
    
    .mula-buy-button.animate::after {
        animation: none;
    }
    
    .debug-info {
        margin-top: 30px;
        padding: 15px;
        background-color: #e8e8e8;
        border-radius: 8px;
        font-family: monospace;
        white-space: pre-wrap;
        width: 100%;
        max-width: 500px;
    }

    /* Fallback content for troubleshooting */
    .fallback-content {
        margin-top: 20px;
        padding: 20px;
        background-color: #ffe0e0;
        border: 1px solid #ff5555;
        border-radius: 8px;
        display: none;
    }
    
    /* Title Glow Animation */
    .title-glow::before {
        display: none;
    }
    
    @keyframes glowSweep {
        0% { left: -100%; }
        100% { left: 200%; }
    }
    
    /* Return to Playground button */
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

    /* 3D Product View */
    .view-3d-button {
        position: absolute;
        bottom: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.9);
        border: none;
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 13px;
        font-weight: 500;
        color: #333;
        display: flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
    }

    .view-3d-button:hover {
        background: white;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
    }

    .view-3d-button svg {
        width: 16px;
        height: 16px;
        stroke: #333;
        stroke-width: 2;
    }
</style>
<main bind:this={mainEl}>
    <div class="container">
        <div class="mula-widget-7">
            <div class="mula-sticky-carousel">
                <div class="mula-sticky-header">
                    <div>
                        <div class="mula-sticky-title">Related Products</div>
                        <div class="mula-sticky-subtitle">Curated for you, by Ṁula</div>
                    </div>
                    <!-- Arrows container in header -->
                    <div class="arrows-container">
                        <div class="scroll-indicator left">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
                            </svg>
                        </div>
                        <div class="scroll-indicator right">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="mula-sticky-track-container">
                    <div class="mula-sticky-track">
                      <!-- hidden placeholder for css -->
                      <div class="mula-sticky-card tapped" style="display:none;">
                        <div class="mula-sticky-image">
                            <div class="mula-sticky-label"></div>
                            <button class="mula-like-button active">
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                              </svg>
                            </button>
                        </div>
                        <div class="mula-sticky-info">
                            <div class="mula-sticky-name"></div>
                            <div class="mula-sticky-price"></div>
                        </div>
                        <button class="mula-buy-button"></button>
                      </div>
                        <!-- Cards will be inserted here via JavaScript -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Fallback content in case JavaScript fails -->
        <div class="fallback-content" id="fallback">
            <h3>Fallback Content</h3>
            <p>If you're seeing this, the JavaScript may not be executing properly.</p>
        </div>
    </div>
    <div class="debug-info" style="display: none;">
        <div id="debug-output">Debug information will appear here</div>
    </div>
</main>


<script>

    import { onMount } from 'svelte';
    // import { feedStore, loadFeed } from './FeedStore.js';
    import { log, logEvent } from "./Logger";
    import { setupViewTracking, createProductCardViewTracker } from './ViewTracker.js';
    let mainEl;
    let widgetLogParams = {widget: "topshelf"};
    let stickyProducts = [];
    let leftIndicator;
    let rightIndicator;
    let userHasInteracted = false;
    let isGridView = false;
    let isRefreshing = false;
    let productFeed;
    let productCardViewTracker; // Product card view tracking controller

    // Function to mark user interaction and stop nudge animation
    function markUserInteraction() {
        if (!userHasInteracted) {
            userHasInteracted = true;
            console.log("User has interacted - stopping arrow animation");
            debugLog("User has interacted - stopping arrow animation");
            if (rightIndicator) {
                rightIndicator.classList.add('user-interacted');
                // Force animation to stop immediately
                rightIndicator.style.animation = 'none';
            }
        }
    }

    // Show fallback content after timeout if JavaScript doesn't execute
    setTimeout(function() {
        const track = mainEl.querySelector('.mula-sticky-track');
        if (!track || !track.children || track.children.length <= 0) {
            mainEl.querySelector('#fallback').style.display = 'block';
            mainEl.querySelector('#debug-output').innerHTML = '⚠️ Carousel not loaded within timeout period, showing fallback content\n' + mainEl.querySelector('#debug-output').innerHTML;
        }
    }, 2000);

    // Debug log function - modified to prepend logs at the top
    function debugLog(message) {
        console.log(message); // Also log to console
        const debugOutput = mainEl.querySelector('#debug-output');
        const timestamp = new Date().toLocaleTimeString();
        debugOutput.innerHTML = `[${timestamp}] ${message}\n` + debugOutput.innerHTML;
    }

    // debugLog('Script loaded');
    let quickModalBuyButtonHandler = () => {};
    function showModal(product) {
        window.Mula.showModal(product);
    }

    // Widget 7 - Sticky Carousel
    function createStickyCarousel() {
        debugLog('createStickyCarousel function called');
        const stickyTrack = mainEl.querySelector('.mula-sticky-track');

        if (!stickyTrack) {
            debugLog('⚠️ ERROR: Sticky track element not found');
            return;
        }

        debugLog('Building sticky carousel elements');

        try {
            // Function to create a product card
            const createCard = (product, index) => {
                const card = document.createElement('div');
                card.className = 'mula-sticky-card';
                card.dataset.index = index; // Add data-index for tracking
                card.dataset.productId = product.product_id; // Add product ID for view tracking
                card.innerHTML = `
                    <div class="mula-sticky-image" style="background-image: url('${getPostImage(product)}')">
                        <div class="mula-sticky-label" style="${product.tag ? "" : "display:none;"}">${product.tag}</div>
                        <button class="mula-like-button">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="mula-sticky-info">
                        <div class="mula-sticky-name">${product.title}</div>
                        <div class="mula-sticky-price">${product.price}</div>
                    </div>
                    <button class="mula-buy-button">Buy</button>
                `;

                // Card click event (exclude like and buy buttons)
                card.addEventListener('click', (e) => {
                    if (!e.target.closest('.mula-like-button') && !e.target.closest('.mula-buy-button')) {
                        debugLog(`Card clicked: ${product.title}`);
                        logEvent("mula_feed_click", product.product_id, {...widgetLogParams});
                        // Remove any existing animations
                        card.classList.remove('tapped');

                        // Force a reflow to ensure the animation restarts
                        void card.offsetWidth;

                        // Add tap animation
                        card.classList.add('tapped');

                        // Remove the tapped class after animation completes to restore tilt functionality
                        setTimeout(() => {
                            card.classList.remove('tapped');

                            // Re-attach tilt handlers if they were lost
                            if (!card.hasAttribute('data-tilt-reinitialized-after-click')) {
                                card.setAttribute('data-tilt-reinitialized-after-click', 'true');
                                // card.addEventListener('mousemove', handleTilt);
                                // card.addEventListener('mouseleave', resetTilt);
                            }
                        }, 500); // Match animation duration
                        showModal(product);
                    }
                });

                // Like button event
                const likeButton = card.querySelector('.mula-like-button');
                likeButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    likeButton.classList.toggle('active');

                    if (likeButton.classList.contains('active')) {
                        logEvent("mula_unlike_click", product.product_id, {...widgetLogParams});
                        likeButton.innerHTML = `
                            <svg viewBox="0 0 24 24" fill="red" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                        `;
                        debugLog(`Liked: ${product.title}`);
                    } else {
                        logEvent("mula_like_click", product.product_id, {...widgetLogParams});
                        likeButton.innerHTML = `
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                        `;
                        debugLog(`Unliked: ${product.title}`);
                    }

                    // Heart animation
                    likeButton.style.transform = 'scale(1.2)';
                    setTimeout(() => {
                        likeButton.style.transform = 'scale(1)';
                    }, 200);
                });

                // Buy button event
                const buyButton = card.querySelector('.mula-buy-button');
                buyButton.addEventListener('click', (e) => {
                    logEvent("mula_store_click", product.product_id, {...widgetLogParams});
                    e.stopPropagation();

                    // Visual feedback for the card itself
                    card.classList.add('tapped');
                    setTimeout(() => {
                        card.classList.remove('tapped');

                        // Re-attach tilt handlers if they were lost
                        if (!card.hasAttribute('data-tilt-reinitialized-after-click')) {
                            card.setAttribute('data-tilt-reinitialized-after-click', 'true');
                            // card.addEventListener('mousemove', handleTilt);
                            // card.addEventListener('mouseleave', resetTilt);
                        }
                    }, 500); // Match animation duration

                    buyButton.classList.add('animate');
                    setTimeout(() => {
                        buyButton.classList.remove('animate');
                    }, 600);
                    debugLog(`Buy clicked: ${product.title}`);
                    window.Mula.openMulaLink(product.stores[0]?.link, product.product_id);
                });

                return card;
            };

            // Clear any existing cards
            stickyTrack.innerHTML = '';

            // Create original cards
            stickyProducts.forEach((product, index) => {
                const card = createCard(product, index);
                stickyTrack.appendChild(card);
                debugLog(`Card ${index+1} appended: ${product.title}`);
                
                // Add card to view tracking
                if (productCardViewTracker) {
                    productCardViewTracker.observe(card);
                }
            });

            // Clone first 3 cards and append to end for infinite loop effect
            for (let i = 0; i < 3; i++) {
                const product = stickyProducts[i];
                const card = createCard(product, i + '_clone');
                stickyTrack.appendChild(card);
                debugLog(`Clone card ${i+1} appended: ${product.title}`);
                
                // Add card to view tracking
                if (productCardViewTracker) {
                    productCardViewTracker.observe(card);
                }
            }

            // Clone last 3 cards and prepend to beginning for bidirectional infinite loop
            for (let i = stickyProducts.length - 3; i < stickyProducts.length; i++) {
                const product = stickyProducts[i];
                const card = createCard(product, i + '_clone_start');
                stickyTrack.prepend(card);
                debugLog(`Clone card ${i+1} prepended: ${product.title}`);
                
                // Add card to view tracking
                if (productCardViewTracker) {
                    productCardViewTracker.observe(card);
                }
            }

            // Setup scroll indicators
            const trackContainer = mainEl.querySelector('.mula-sticky-track-container');
            leftIndicator = mainEl.querySelector('.scroll-indicator.left');
            rightIndicator = mainEl.querySelector('.scroll-indicator.right');

            // Calculate offset for initial scroll position (to position at the first non-clone card)
            const cardWidth = 165; // Card width + gap
            const initialScrollPosition = cardWidth * 3; // Skip the 3 prepended clone cards

            // Set initial scroll position without animation
            setTimeout(() => {
                stickyTrack.scrollLeft = initialScrollPosition;
                // Add scroll event listener to manage indicators visibility and infinite scrolling
                setTimeout(() => {
                    stickyTrack.addEventListener('scroll', () => {
                        // alert("scroll event");
                        log("scroll event", {stickyTrackScrollLeft: stickyTrack.scrollLeft});
                        // Always show both indicators now since we have infinite scrolling
                        if (leftIndicator) {
                            leftIndicator.style.display = 'flex';
                        }

                        if (rightIndicator) {
                            rightIndicator.style.display = 'flex';
                        }

                        // Mark user interaction on any scroll
                        markUserInteraction();

                        // Handle infinite scroll logic
                        // handleInfiniteScroll();
                    });
                }, 1200);
                debugLog('Set initial scroll position to show original cards');
            }, 100);

            // Touch and drag functionality for mobile
            let isDown = false;
            let startX;
            let scrollLeft;

            stickyTrack.addEventListener('mousedown', (e) => {
                isDown = true;
                stickyTrack.style.cursor = 'grabbing';
                startX = e.pageX - stickyTrack.offsetLeft;
                scrollLeft = stickyTrack.scrollLeft;
                markUserInteraction();
                e.preventDefault();
            });

            stickyTrack.addEventListener('mouseleave', () => {
                isDown = false;
                stickyTrack.style.cursor = 'grab';
            });

            stickyTrack.addEventListener('mouseup', () => {
                isDown = false;
                stickyTrack.style.cursor = 'grab';
            });

            stickyTrack.addEventListener('touchend', () => {
                isDown = false;
            });

            stickyTrack.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - stickyTrack.offsetLeft;
                const walk = (x - startX) * 1.5; // Scroll speed multiplier
                stickyTrack.scrollLeft = scrollLeft - walk;
                markUserInteraction();
            });
        } catch (err) {
            debugLog(`⚠️ ERROR creating cards: ${err.message}`);
        }

        debugLog('Sticky carousel initialized successfully');

        // Handle infinite scroll logic
        const handleInfiniteScroll = () => {
            const cardWidth = 165; // Card width + gap
            const totalOriginalWidth = cardWidth * stickyProducts.length;
            const threshold = cardWidth * 3; // 3 cards width as threshold

            // If scrolled near the end (last 3 cloned cards)
            log("scroll metrics", {totalOriginalWidth, threshold, stickyTrackScrollLeft: stickyTrack.scrollLeft});
            // log("conditional", {lhs: stickyTrack.scrollLeft, rhs: totalOriginalWidth + threshold - 50});
            if (stickyTrack.scrollLeft > totalOriginalWidth + threshold - 50) {
                log("Loop back to beginning (infinite scroll)", {totalOriginalWidth, threshold, stickyTrackScrollLeft: stickyTrack.scrollLeft});
                // Jump back to the beginning + 3 cards without animation
                stickyTrack.style.scrollBehavior = 'auto';
                stickyTrack.scrollLeft = threshold;
                setTimeout(() => {
                    stickyTrack.style.scrollBehavior = 'smooth';
                }, 50);
                debugLog('Loop back to beginning (infinite scroll)');
            }

            // If scrolled to the very beginning (first 3 cloned cards)
            if (stickyTrack.scrollLeft < threshold - 50) {
                log("Loop back to beginning (infinite scroll)", {totalOriginalWidth, threshold, stickyTrackScrollLeft: stickyTrack.scrollLeft});
                // Jump to end - 3 cards without animation
                stickyTrack.style.scrollBehavior = 'auto';
                stickyTrack.scrollLeft = totalOriginalWidth;
                setTimeout(() => {
                    stickyTrack.style.scrollBehavior = 'smooth';
                }, 50);
                debugLog('Loop to end (infinite scroll - backward)');
            }
        };

        // Fix arrow navigation - completely rewrite with direct event attachment
        const leftArrow = mainEl.querySelector('.scroll-indicator.left');
        const rightArrow = mainEl.querySelector('.scroll-indicator.right');

        // Completely clear and directly set click handlers
        if (leftArrow) {
            // Clean up by removing all event listeners
            const newLeftArrow = leftArrow.cloneNode(true);
            leftArrow.parentNode.replaceChild(newLeftArrow, leftArrow);

            newLeftArrow.onclick = function(e) {
                console.log("LEFT ARROW CLICKED - Direct handler");
                debugLog("LEFT ARROW CLICKED - Direct handler");
                e.preventDefault();
                e.stopPropagation();

                // Mark user interaction immediately
                markUserInteraction();

                // Explicitly calculate scroll amount
                const cardWidth = 165; // Card width + gap
                const scrollAmount = cardWidth * 2;

                // Scroll with explicit values
                const currentScroll = stickyTrack.scrollLeft;
                stickyTrack.scrollTo({
                    left: currentScroll - scrollAmount,
                    behavior: 'smooth'
                });

                // Visual feedback
                this.style.transform = 'scale(0.92)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 200);

                return false;
            };
        }

        if (rightArrow) {
            // Clean up by removing all event listeners
            const newRightArrow = rightArrow.cloneNode(true);
            rightArrow.parentNode.replaceChild(newRightArrow, rightArrow);

            newRightArrow.onclick = function(e) {
                console.log("RIGHT ARROW CLICKED - Direct handler");
                debugLog("RIGHT ARROW CLICKED - Direct handler");
                e.preventDefault();
                e.stopPropagation();

                // Mark user interaction immediately
                markUserInteraction();

                // Explicitly calculate scroll amount
                const cardWidth = 165; // Card width + gap
                const scrollAmount = cardWidth * 2;

                // Scroll with explicit values
                const currentScroll = stickyTrack.scrollLeft;
                stickyTrack.scrollTo({
                    left: currentScroll + scrollAmount,
                    behavior: 'smooth'
                });

                // Visual feedback
                this.style.transform = 'scale(0.92)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 200);

                return false;
            };
        }

        // Trigger scroll event to check indicators initially
        // setTimeout(() => {
        //     stickyTrack.dispatchEvent(new Event('scroll'));
        // }, 500);
    }

    const getPostImage = (item) => {
        return item?.thumbnails?.[0] || item?.thumbnail?.static || item?.thumbnail;
    }

    // Initialize the carousel when the page loads
    onMount(() => {
      debugLog('DOM loaded, initializing carousel');
      stickyProducts = [...window.Mula.feed];
      logEvent("mula_widget_view", "topshelf", {...widgetLogParams});
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
      
      createStickyCarousel();
      // Add the 3D tilt effect to cards
      // setupTiltEffect();
    })

    // Setup 3D tilt effect for cards
    function setupTiltEffect() {
        const cards = mainEl.querySelectorAll('.mula-sticky-card');

        cards.forEach(card => {
            // card.addEventListener('mousemove', handleTilt);
            // card.addEventListener('mouseleave', resetTilt);
            card.addEventListener('mouseenter', e => {
                card.style.transition = 'transform 0.2s ease';
            });
        });

        // Re-run after cards may have been cloned for infinite scroll
        setTimeout(() => {
            const allCards = mainEl.querySelectorAll('.mula-sticky-card');
            allCards.forEach(card => {
                if (!card.hasAttribute('data-tilt-initialized')) {
                    card.setAttribute('data-tilt-initialized', 'true');
                    // card.addEventListener('mousemove', handleTilt);
                    // card.addEventListener('mouseleave', resetTilt);
                    card.addEventListener('mouseenter', e => {
                        card.style.transition = 'transform 0.2s ease';
                    });
                }
            });
        }, 1000);
    }

    function handleTilt(e) {
        const card = this;
        const rect = card.getBoundingClientRect();

        // Calculate mouse position relative to the card
        const x = e.clientX - rect.left; // x position within the card
        const y = e.clientY - rect.top; // y position within the card

        // Calculate the card's dimensions
        const width = rect.width;
        const height = rect.height;

        // Calculate rotation angles based on mouse position
        // Apple-style subtle tilt effect that tilts AWAY from cursor
        // Reduced max angle to 5 degrees for subtlety (was 10)
        // NOT using negative tiltY value to reverse the direction (tilting away from cursor)
        const tiltX = -((y - height / 2) / (height / 2) * 4); // Reduced to 4 degrees
        const tiltY = ((x - width / 2) / (width / 2) * 4); // Reduced to 4 degrees

        // Apply the transforms with easing
        // Use cubic-bezier easing for Apple-like fluid motion
        card.style.transition = 'none';

        // Use requestAnimationFrame for smoother animation
        requestAnimationFrame(() => {
            card.style.transform = `perspective(1500px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;

            // More subtle depth shift for elements inside the card
            const image = card.querySelector('.mula-sticky-image');
            const info = card.querySelector('.mula-sticky-info');
            const button = card.querySelector('.mula-buy-button');

            if (image) image.style.transform = `translateZ(8px)`; // More subtle lift
            if (info) image.style.transform = `translateZ(4px)`; // More subtle lift
            if (button) image.style.transform = `translateZ(6px)`; // More subtle lift

            // Brighten border on tilt
            card.style.border = '1px solid rgba(255, 255, 255, 0.3)';
        });
    }

    function resetTilt() {
        const card = this;

        // Reset the card's transform with a smooth transition
        // Enhanced easing curve for Apple-style fluid return
        card.style.transition = 'transform 0.8s cubic-bezier(0.19, 1, 0.22, 1), border 0.8s cubic-bezier(0.19, 1, 0.22, 1)'; // Apple-style spring easing
        card.style.transform = 'perspective(1500px) rotateX(0) rotateY(0) scale(1)';
        card.style.border = '1px solid rgba(255, 255, 255, 0.08)'; // Reset border

        // Reset inner elements with the same smooth transition
        const image = card.querySelector('.mula-sticky-image');
        const info = card.querySelector('.mula-sticky-info');
        const button = card.querySelector('.mula-buy-button');

        if (image) {
            image.style.transition = 'transform 0.8s cubic-bezier(0.19, 1, 0.22, 1)';
            image.style.transform = 'translateZ(0)';
        }
        if (info) {
            info.style.transition = 'transform 0.8s cubic-bezier(0.19, 1, 0.22, 1)';
            info.style.transform = 'translateZ(0)';
        }
        if (button) {
            button.style.transition = 'transform 0.8s cubic-bezier(0.19, 1, 0.22, 1)';
            button.style.transform = 'translateZ(0)';
        }
    }
</script>
