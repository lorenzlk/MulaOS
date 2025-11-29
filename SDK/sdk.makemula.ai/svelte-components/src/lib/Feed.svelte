<svelte:options tag="mula-feed" />
<script>
  export let feed_url;
  export let layout = "vertical";
  let feed = [];
  import { onMount } from 'svelte';
  import Card from './Card.svelte';
  import { log, logEvent } from './Logger';

  onMount(() => {
    feed = [...window.Mula.feed];
  });

  const getPostImage = (item) => {
    return item?.thumbnails?.[0] || item?.thumbnail?.static || item?.thumbnail;
  }
</script>

<div class="mula-feed" class:row={layout === "horizontal"} class:column={layout==="vertical"}>
  {#each feed as item}
    <mula-card rating={item.rating} reviews={item.reviews} price={item.price} tag={item.tag} username={item.title} postimage={getPostImage(item)} caption={item.description || item.source} link={item.link} product_link={item.product_link} immersive_url={item.immersive_url} product_id={item.product_id} layout={layout}></mula-card>
  {/each}
</div>

<style>
  .mula-feed {
    display: flex;
    box-sizing: border-box;
  }

  .mula-feed.row {
    flex-direction: row;
    width: 99%;
    gap: 12px;
    overflow: scroll;
  }

  .mula-feed.column {
    gap: 24px;
    margin-top: 24px;
    flex-direction: column;
  }
  .mula-feed.column mula-card {
    width: 100%;
  }

  .mula-feed.row mula-card {
    width: 300px;
  }

  @media (min-width: 1025px) {
    .mula-feed.column {
      max-width: 50vw;
    }
  }
</style>
