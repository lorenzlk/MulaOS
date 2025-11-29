<svelte:options tag="mula-product-modal" />
<!-- Product Quick View Modal -->
<div bind:this={modalElement} class="mula-modal" class:active={true}>
    <div class="mula-modal-content">
        <div class="mula-modal-container">
            <div class="mula-modal-image">
                <button class="mula-close-modal" on:click={(e) => {
                    e.stopPropagation();
                    window.Mula.closeModal();
                }}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="mula-modal-details">
                <div class="mula-product-brand"></div>
                <h2 class="mula-product-title"></h2>
                <div class="mula-product-rating"><span></span></div>

                <p class="mula-product-overview"></p>

                <div class="mula-product-meta">
                    <div class="mula-meta-item">
                        <span class="mula-meta-label">Price</span>
                        <span class="mula-meta-value"></span>
                    </div>
                    <div class="mula-action-buttons">
                        <button class="mula-buy-now-btn" on:click={() => {
                            if (product?.stores?.[0]?.link) {
                                logEvent('mula_store_click', product.product_id);
                                window.Mula.openMulaLink(product.stores[0].link, product.product_id);
                            }
                        }}>Buy Now</button>
                    </div>
                </div>

                <div class="mula-product-features">
                    <h3 class="mula-features-title">Key Features</h3>
                    <ul class="mula-feature-list">
                        <li class="mula-feature-item" style="display: none;"></li>
                    </ul>
                </div>

                <div class="mula-action-buttons">
                    <button class="mula-buy-now-btn" on:click={() => {
                        if (product?.stores?.[0]?.link) {
                            logEvent('mula_store_click', product.product_id);
                            window.Mula.openMulaLink(product.stores[0].link, product.product_id);
                        }
                    }}>Buy Now</button>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .mula-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483647;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    }

    .mula-modal.active {
        opacity: 1;
        visibility: visible;
    }

    .mula-modal-content {
        width: 90%;
        max-width: 800px;
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        transform: scale(0.95);
        opacity: 0;
        transition: all 0.3s ease;
    }

    .mula-modal.active .mula-modal-content {
        transform: scale(1);
        opacity: 1;
    }

    .mula-modal-container {
        display: flex;
        flex-direction: column;
        max-height: 85vh;
    }

    .mula-modal-image {
        flex: 1;
        min-height: 300px;
        background-size: cover;
        background-position: center;
        position: relative;
    }

    .mula-modal-details {
        flex: 1;
        padding: 30px;
        overflow-y: auto;
    }

    .mula-modal-details > .mula-action-buttons {
        display: none;
    }

    .mula-product-rating {
        color: #ff9500;
        font-size: 11px;
        margin-bottom: 3px;
    }

    .mula-product-rating span {
        color: #999;
        font-size: 10px;
    }

    .mula-product-brand {
        font-size: 14px;
        color: #666;
        margin-bottom: 5px;
    }

    .mula-product-title {
        font-size: 24px;
        font-weight: 500;
        margin-bottom: 15px;
        color: #333;
    }

    .mula-product-overview {
        font-size: 15px;
        line-height: 1.6;
        color: #555;
        margin-bottom: 20px;
    }

    .mula-product-meta {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
        justify-content: space-between;
    }

    .mula-meta-item {
        display: flex;
        flex-direction: column;
    }

    .mula-meta-label {
        font-size: 12px;
        color: #999;
        margin-bottom: 5px;
    }

    .mula-meta-value {
        font-size: 14px;
        font-weight: 500;
        color: #333;
    }

    .mula-product-features {
        margin-bottom: 20px;
    }

    .mula-features-title {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 10px;
        color: #333;
    }

    .mula-feature-list {
        list-style: none;
    }

    .mula-feature-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: 10px;
        font-size: 14px;
        color: #555;
    }

    .mula-feature-item::before {
        content: '•';
        color: #007aff;
        font-weight: bold;
        margin-right: 10px;
    }

    .mula-product-meta .mula-action-buttons {
        display: flex;
        gap: 15px;
        margin-top: 5px
    }

    .mula-action-buttons button {
        padding: 12px 24px;
        border-radius: 10px;
        font-weight: 500;
        font-size: 15px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
    }

    .mula-buy-now-btn {
        background: #007aff;
        color: white;
        flex: 2;
    }

    .mula-buy-now-btn:hover {
        background: #0066d6;
    }

    .mula-close-modal {
        position: absolute;
        top: 20px;
        right: 20px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.3);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        z-index: 10;
    }

    .mula-close-modal:hover {
        background: rgba(0, 0, 0, 0.4);
    }

    .mula-close-modal svg {
        width: 20px;
        height: 20px;
        stroke: white;
        stroke-width: 2;
    }
    @media (min-width: 768px) {
        .mula-modal-details > .mula-action-buttons {
            display: flex;
            margin-top: 0;
        }
        .mula-product-meta .mula-action-buttons {
            display: none;
        }
        .mula-modal-container {
            flex-direction: row;
        }
        .mula-action-buttons {
            left: unset;
            top: unset;
            margin-top: 30px;
            position: relative;
        }
    }
</style>

<script>
    import { logEvent, log } from "./Logger";

    export let product_json;
    let modalElement;

    // Convert the stringified product to an object if needed
    $: product = typeof product_json === 'string' ? JSON.parse(product_json) : product_json;

    // Update DOM when product changes
    $: if (product && modalElement) {
        log("ProductModal", product);
        logEvent('mula_modal_open', product.product_id);
        
        const shadowRoot = modalElement;
        const quickViewImage = shadowRoot.querySelector('.mula-modal-image');
        const productBrand = shadowRoot.querySelector('.mula-product-brand');
        const productTitle = shadowRoot.querySelector('.mula-product-title');
        const modalRating = shadowRoot.querySelector('.mula-modal-details .mula-product-rating');
        const productOverview = shadowRoot.querySelector('.mula-product-overview');
        const metaValues = shadowRoot.querySelectorAll('.mula-meta-value');
        const featuresList = shadowRoot.querySelector('.mula-feature-list');

        // Update product image
        quickViewImage.style.backgroundImage = `url('${getPostImage(product)}')`;

        // Update product details
        if(product.brand) {
            productBrand.style.display = '';
            productBrand.textContent = product.brand;
        } else {
            productBrand.style.display = 'none';
        }

        productTitle.textContent = product.title;
        if(product.rating) {
            modalRating.style.display = '';
            modalRating.innerHTML = `★★★★★ <span>(${product.rating}${product.reviews ? `/5 from ${product.reviews} reviews` : '/5'})</span>`;
        } else {
            modalRating.style.display = 'none';
        }

        productOverview.textContent = product.description;

        // Update meta values (price)
        metaValues[0].textContent = product.price;

        // Update features list
        featuresList.innerHTML = '';
        const features = product.about_the_product?.features || [];
        if(features.length === 0) {
            shadowRoot.querySelector('.mula-product-features').style.display = 'none';
        }
        (features).slice(0,4).forEach(feature => {
            const li = document.createElement('li');
            li.className = 'mula-feature-item';
            li.textContent = `${feature.title}: ${feature.value}`;
            featuresList.appendChild(li);
        });
    }

    function getPostImage(item) {
        return item?.thumbnails?.[0] || item?.thumbnail?.static || item?.thumbnail;
    }
</script> 