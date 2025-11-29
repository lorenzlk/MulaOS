<svelte:options tag="mula-carousel" />
<script>
  import { onMount, onDestroy } from "svelte";

  export let images = [];
  export let interval = 8000; // Auto-play interval in ms
  export let size = "large";
  let currentIndex = 0;
  let autoPlay;
  let startX = 0;
  let endX = 0;

  function next() {
    currentIndex = (currentIndex + 1) % images.length;
  }

  function prev() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
  }

  function goTo(index) {
    currentIndex = index;
  }

  function startAutoplay() {
    stopAutoplay();
    autoPlay = setInterval(next, interval);
  }

  function stopAutoplay() {
    clearInterval(autoPlay);
  }

  function handleTouchStart(event) {
    startX = event.touches[0].clientX;
  }

  function handleTouchEnd(event) {
    endX = event.changedTouches[0].clientX;
    if (startX - endX > 50) next(); // Swipe left
    if (endX - startX > 50) prev(); // Swipe right
  }

  onMount(() => {
    startAutoplay();
  });

  onDestroy(() => {
    stopAutoplay();
  });
</script>

<div class="carousel" on:mouseenter={stopAutoplay} on:mouseleave={startAutoplay}>
  <button class="prev" on:click={prev}>&#10094;</button>

  <!-- Wrapper for slides -->
  <div
    class="carousel-container"
    on:touchstart={handleTouchStart}
    on:touchend={handleTouchEnd}
    style="transform: translateX(-{currentIndex * 100}%);"
  >
    {#each images as image}
      <img src={image} alt="Slide" class="slide" class:small={size === "small"} />
    {/each}
  </div>

  <button class="next" on:click={next}>&#10095;</button>

  <!-- Dots Navigation -->
  <div class="dots">
    {#each images as _, i}
      <span class="dot {i === currentIndex ? 'active' : ''}" on:click={() => goTo(i)}></span>
    {/each}
  </div>
</div>

<style>
  .carousel {
    position: relative;
    width: 100vw; /* Ensures full viewport width */
    max-width: 100vw;
    margin: auto;
    overflow: hidden;
  }

  .carousel-container {
    display: flex;
    flex-direction: row;
    transition: transform 0.5s ease-in-out;
    width: 100%;
  }

  .slide {
    flex: 0 0 100vw;
    object-fit: contain; /* Ensures the whole image fits without cropping */
    display: block; /* Prevents inline spacing issues */
    max-height: 45vh;
  }

  .slide.small {
    max-height: 25vh;
  }

  .prev,
  .next {
    display: none;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    padding: 10px 15px;
    cursor: pointer;
    font-size: 18px;
    border-radius: 50%;
    z-index: 2;
  }

  .prev {
    left: 10px;
  }

  .next {
    right: 10px;
  }

  .dots {
    text-align: center;
    padding: 10px;
  }

  .dot {
    height: 10px;
    width: 10px;
    margin: 0 5px;
    background-color: #bbb;
    border-radius: 50%;
    display: inline-block;
    cursor: pointer;
  }

  .dot.active {
    background-color: #717171;
  }
</style>

