// Minimal proxy script to inject pin badge functionality
(() => {
    // Only inject styles when Widget 2 is active
    const injectStyles = () => {
        if (document.getElementById('mula-pin-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'mula-pin-styles';
        style.textContent = `
            .mula-pin-badge {
                display: none;
                align-items: center;
                justify-content: center;
                gap: 8px;
                height: 38px;
                padding: 0 20px;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                color: white;
                border: none;
                border-radius: 25px;
                cursor: pointer;
                font-family: "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
                letter-spacing: 0.3px;
                position: relative;
                overflow: hidden;
                white-space: nowrap;
                margin: 12px auto;
                width: fit-content;
            }

            .mula-pin-badge.visible {
                display: flex;
            }

            .mula-pin-badge::before {
                content: '';
                position: absolute;
                left: 10px;
                top: 50%;
                width: 6px;
                height: 6px;
                background: #ff3b30;
                border-radius: 50%;
                transform: translateY(-50%);
                transition: background-color 0.2s ease;
            }

            .mula-pin-badge:hover {
                background: rgba(0, 0, 0, 0.8);
                transform: translateY(-1px);
            }

            .mula-pin-badge.pinned {
                background: rgba(0, 0, 0, 0.9);
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
                transform: none;
            }

            .mula-pin-badge.pinned::before {
                background: #30d158;
            }
        `;
        document.head.appendChild(style);
    };

    // Create and inject pin badge
    const createPinBadge = (title, img) => {
        const badge = document.createElement('div');
        badge.className = 'mula-pin-badge';
        badge.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span>This is my style!</span>
        `;
        img.parentNode.insertBefore(badge, img);
        return badge;
    };

    // Initialize pin badges
    const initializePinBadges = () => {
        const articles = document.querySelectorAll('article');
        articles.forEach((article, index) => {
            const title = article.querySelector('h2');
            const img = article.querySelector('img');
            if (title && img) {
                const badge = createPinBadge(title, img);
                badge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    badge.classList.toggle('pinned');
                    const span = badge.querySelector('span');
                    if (badge.classList.contains('pinned')) {
                        span.textContent = 'Added to My Style';
                        if (navigator.vibrate) navigator.vibrate(50);
                        window.parent.postMessage({
                            type: 'pinStatusChanged',
                            pinned: true,
                            index,
                            productTitle: title.textContent,
                            productImage: img.src
                        }, '*');
                    } else {
                        span.textContent = 'This is my style!';
                        window.parent.postMessage({
                            type: 'pinStatusChanged',
                            pinned: false,
                            index
                        }, '*');
                    }
                });
            }
        });
    };

    // Listen for widget state changes
    window.addEventListener('message', (event) => {
        if (event.data.type === 'widgetStateChanged' && event.data.widget === '2') {
            if (event.data.active) {
                injectStyles();
                initializePinBadges();
            }
            document.querySelectorAll('.mula-pin-badge').forEach(badge => {
                badge.classList.toggle('visible', event.data.active);
            });
        }
    });

    // Notify parent that we're ready
    window.parent.postMessage({ type: 'proxyReady' }, '*');
})(); 