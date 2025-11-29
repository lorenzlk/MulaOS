<svelte:options tag="mula-card" />
<script>
  export let profilePicture = "https://placehold.co/50x50";
  export let username = "username";
  export let postimage = "https://placehold.co/600x400";
  export let caption = "This is a sample caption!";
  export let link;
  export let product_link;
  export let page_token;
  export let price;
  export let tag;
  export let rating;
  export let reviews;
  export let immersive_url;
  export let product_id;
  export let immersive;
  export let layout;

  let cardEl;
  let imageEl;

  let immersiveItem;
  import { tick } from "svelte";
  import Carousel from "./Carousel.svelte";
  import { log, logEvent } from "./Logger";
  const pluralize = (count, singular, plural) => {
    return count === 1 ? singular : plural;
  }
  const getYoutubeEmbedLink = (videoUrl) => {
    const url = new URL(videoUrl);
    if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com' || url.hostname === 'm.youtube.com') {
      const videoId = url.searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.hostname === 'youtu.be') {
      const videoId = url.pathname.slice(1);
      return `https://www.youtube.com/embed/${videoId}`;
    } else {
      throw new Error('Not a valid YouTube URL');
    }
  }
  const getStoreName = (store) => {
    const storeURL = new URL(store.link);
    const hostnameTokens = storeURL.hostname.split(".");
    while(hostnameTokens.length > 2) {
      hostnameTokens.shift();
    }
    const name = hostnameTokens[0];
    const nameTokens = name.split("");
    const firstLetter = nameTokens.shift();
    return `${firstLetter.toUpperCase()}${nameTokens.join("")}`;
  }
  const goImmersive = async () => {
    log("Card.goImmersive");
    if(immersive) {
      return;
    }
    disableScroll();
    if(!immersiveItem) {
      if(immersive_url) {
        const response = await fetch(immersive_url);
        if(response.ok){
          immersiveItem = await response.json();
          log("Card immersive Item", immersiveItem);
        }
      }
    }
    immersive = true;
    logEvent("mula_feed_click", product_id, { product_id, layout });
    await tick();
    cardEl.scrollTop = 0;
    log("Card scrolled to top");
  }

  let scrollPosition = 0;
  function disableScroll() {
    // Store the current scroll position
    scrollPosition = window.scrollY || document.documentElement.scrollTop;
    log("disabling scroll", {scrollPosition});
    // Disable scrolling while keeping the position fixed
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.left = '0';
    document.body.style.width = '100%';
  }

  function enableScroll() {
    log("enabling scroll", {scrollPosition});
    // Re-enable scrolling and restore the position
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.width = '';

    // Restore the previous scroll position
    document.documentElement.scrollTop = scrollPosition;
    document.body.scrollTop = scrollPosition;
  }

</script>

<style>
  .card {
    width: inherit;
    border: 1px solid #dbdbdb;
    background: #fff;
    font-family: var(--mula-font-family, Arial, sans-serif);
    position: relative;
    border-radius: 10px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
  }

  .card .header span.username, .card.immersive .video-list h4 {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }


  .immersive.card .header span.username {
    white-space: inherit;
  }

  .card .image {
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    cursor: pointer;
  }
  .card .image img {
    height: 100%;
    width: auto;
    object-fit: contain; /* or object-fit: cover; depending on what you prefer */
  }

  .card .caption {
    height: 52px;
    line-height: 20px;           /* Set your line height */
    max-height: 52px;           /* 24px * 5 lines = 120px */
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;       /* 120px / 24px = 5 lines */
    -webkit-box-orient: vertical;
    text-overflow: ellipsis;
  }


  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
    border-bottom: 1px solid #dbdbdb;
  }

  .profile-pic {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 10px;
  }

  .username {
    font-weight: bold;
    font-size: 15px;
    width: 92%;
  }

  .actions {
    display: flex;
    padding: 0 10px 10px 10px;
    gap: 9px;
    font-size: 20px;
    color: #262626;
  }

  .caption {
    padding: 10px;
  }

  .caption span {
    font-weight: bold;
    margin-right: 5px;
  }
  div.image {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 9px;
  }
  a {
    color: initial;
    text-decoration: none;
  }
  div.rating {
    width: 100%;
    padding: 10px;
    box-sizing: border-box;
  }
  div.actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    box-sizing: border-box;
  }
  div.actions button {
    width: 100%;
    display: block;
    height: 2rem;
    border-radius: 12px;
    color: var(--mula-btn-c, #fff);
    font-size: var(--mula-btn-sz, 14px);
    font-weight: var(--mula-btn-ft-wt, 400);
    margin: 0;
    cursor: pointer;
  }
  div.actions button.buy {
    background: var(--mula-btn1-bg-c, #198754);
    border: 1px solid var(--mula-btn1-bd-c, #198754);
  }
  div.actions button.buy:hover {
    background: var(--mula-btn1h-bg-c, #157347);
    border-color: var(--mula-btn1h-bd-c, #146c43);
    color: var(--mula-btn1h-c, #fff);
  }
  div.actions button.learn {
    background: var(--mula-btn2-bg-c, #ffc107);
    border: 1px solid var(--mula-btn2-bd-c, #ffc107);
    color: var(--mula-btn2-c, #212529);
  }
  div.actions button.learn:hover {
    background: var(--mula-btn2h-bg-c, #ffca2c);
    border-color: var(--mula-btn2h-bd-c, #ffcd39);
    color: var(--mula-btn2h-c, #212529);
  }

  .ribbon {
    position: absolute;
    top: 10%;
    z-index: 2;
    left: -1px;
    background: var(--mula-rib-bg-c, #c62828); /* Red color similar to the image */
    color: white;
    padding: 5px 15px;
    font-size: 14px;
    font-weight: bold;
    text-transform: uppercase;
    border-radius: 0 3px 3px 0;
    box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2);
  }

  .ribbon::before {
    left: 0;
  }

  .ribbon::after {
    right: 0;
  }

  .card.immersive {
    position: fixed;
    top: env(safe-area-inset-top, 0);
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100%;
    z-index: 2147483646;
    margin-top: 0;
    box-sizing: border-box;
    border: none;
    overflow: scroll;
    scroll-behavior: smooth;
  }
  .card.immersive::before {
    content: '';
    display: block;
    height: 0;
    scroll-margin-top: 0; /* Ensures starting at top */
  }
  .card.immersive .header {
    max-height: 10vh;
  }
  .card.immersive .image {
    max-height: 50vh;
  }
  .card.immersive .image img.post-image {
    max-height: 45vh;
  }
  .card.immersive .caption {
    max-height: 10vh;
  }
  .card.immersive .rating {
    max-height: 5vh;
  }
  .card.immersive .video-list-container {
    max-height: 27vh;
  }
  .card.immersive .actions {
    max-height: 25vh;
    margin-top: auto;
    margin-bottom: env(safe-area-inset-top, 0);
  }
  .card.immersive .caption {
    height: 64px;
  }
  .card.immersive .image {
    width: 100%;
    position: relative;
    height: fit-content;
    padding: 0 0;
  }
  .card.immersive .image > img {
    width: 100%;
    max-height: 20vh;
    min-height: 20vh;
  }
  .card.immersive div.close {
    display: block;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid #000;
    background: #fff;
    color: #000;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    transition: background 0.2s;
  }
  .video-list-container {
    padding: 10px 10px 0 10px;
  }
  .video-list-container h3 {
    margin: 3px 0;
  }
  .video-list {
    width: 100%;
    overflow: scroll;
    flex-direction: row;
    gap: 12px;
    display: flex;
  }
  .video-list .video-card {
    width: 90%;
  }
  .video-list h4 {
    margin: 2px 0;
  }
  .video-list iframe {
/*    width: 100%;*/
/*    height: fit-content;*/
  }
  .video-card {
    display: flex;
    flex-direction: column;
  }
  .card.immersive .actions button.buy {
    height: 3rem;
    font-size: 18px;
  }
  .card.immersive .actions button:first-child {
    margin-top: 12px;
  }
  .card.immersive .actions .learn {
    display: none;
  }
  div.close{
    display: none;
    background: transparent;
    border: none;
    font-size: 24px;
    font-weight: bold;
    cursor: pointer;
    outline: none;
    line-height: 1;
    padding: 8px 12px;
    transition: transform 0.2s, color 0.2s;
  }

  .close:hover {
    color: red;
    transform: rotate(90deg);
  }
  .row {
    display: flex;
    flex-direction: row;
    gap: 9px;
  }
  .card.immersive .row.thumbnails img {
    height: 30px;
    padding: 4px;
    width: fit-content;
    box-sizing: border-box;
    border-radius: 9px;
    padding: 2px;
  }
  .container {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 3px;
  }
  .card.immersive .container {
    height: 100%;
  }
  /* Small desktops and laptops */
  @media (min-width: 1025px) {
    /* Your CSS for small desktops here */
    .card.vertical .actions button {
      width: 50%;
    }
    .card.immersive {
      background: rgba(12,12,12,0.6);
      border-radius: 0;
    }
    .card.immersive div.container {
      width: 50vw;
      top: 50%;
      left: 50%;
      max-height: 90vh;
      overflow-y: scroll;
      position: fixed;
      transform: translate(-50%,-50%);
      z-index: 2147483646;
      background: white;
      border-radius: 12px;
      box-sizing: border-box;
    }
  }
  iframe {
    height: 20vh;
  }
  .card.immersive.hasVids .image {
    max-height: 25vh;
  }
</style>
<main class="card" class:vertical={layout === "vertical"} class:immersive={immersive} bind:this={cardEl} on:click={goImmersive} class:hasVids={immersive && immersiveItem && immersiveItem.product_results.videos}>
  <div class="container">
    <div class="header">
      <span class="username">{username}</span>
      <div class="close" on:click={(e) => {
        e.stopPropagation();
        logEvent("mula_close_click", product_id, { product_id });
        log("close click");
        enableScroll();
        immersive = false;
        if(imageEl)
          imageEl.src = postimage;
        return false;
      }}>&times;</div>
    </div>
    <div class="image">
      {#if tag}
        <div class="ribbon">{tag}</div>
      {/if}
      {#if immersive && immersiveItem && immersiveItem.product_results.thumbnails}
        <mula-carousel images={immersiveItem.product_results.thumbnails} size={immersive && immersiveItem && immersiveItem.product_results.videos ? "small" : "large"}></mula-carousel>
      {:else}
        <img src={postimage} bind:this={imageEl} alt="Post Image" class="post-image" />
      {/if}
    </div>
    <div class="caption">
      {caption}
    </div>
    <div class="rating">
      {#if rating}
        Rated <b>{rating} / 5</b>
      {/if}
      {#if reviews}
        (<i>{reviews} {pluralize(reviews, "review", "reviews")}</i>)
      {/if}
      {#if !rating && !reviews}
        No ratings or reviews.
      {/if}
    </div>
    {#if immersiveItem && immersive}
      {#if immersiveItem.product_results.videos}
        <div class="video-list-container">
          <h3>Videos</h3>
          <div class="video-list">
            {#each immersiveItem.product_results.videos as video, i}
              {#if video.link.indexOf("youtube") > -1}
                <div class="video-card">
                  <h4>{video.title}</h4>
                  <iframe
                    id={`yt_video_${i}`}
                    src={getYoutubeEmbedLink(video.link)}
                    frameborder="0" allowfullscreen
                    onerror="this.remove();">
                  </iframe>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      {/if}
      <div class="actions">
        {#if immersiveItem.product_results.stores}
          {#each immersiveItem.product_results.stores as store, i}
            <button class="buy" on:click={() => {
              logEvent("mula_store_click", product_id, { product_id, layout });
              window.Mula.openMulaLink(store.link, product_id);
            }}>Shop <b>{getStoreName(store)}</b> - {store.price}</button>
          {/each}
        {:else}
          <button class="buy" on:click={() => {
            if(immersive) {
              logEvent("mula_store_click", product_id, { product_id, layout });
              window.Mula.openMulaLink(link || product_link, product_id);
              return;
            }
            immersive = true;
          }}>Shop from {price}</button>
        {/if}
      </div>
    {:else}
      <div class="actions">
        <button class="buy" on:click={(e) => {
          e.stopPropagation();
          if(immersive) {
            logEvent("mula_store_click", product_id, { product_id, layout });
            window.Mula.openMulaLink(link || product_link, product_id);
            return;
          }
          goImmersive();
          return false;
        }}>Shop from {price}</button>
        <button class="learn" on:click={(e) => {
          e.stopPropagation();
          goImmersive();
          return false;
        }}>Learn More</button>
      </div>
    {/if}
  </div>
</main>
