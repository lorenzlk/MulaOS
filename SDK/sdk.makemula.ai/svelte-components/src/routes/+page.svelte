<script>
  import { TopShelf, SmartScroll } from '$lib/index.js';
  import { loadFeed } from '$lib/FeedStore.js';
  import { onMount } from 'svelte';
  import '$lib/global.css';
  export let data;

  let url = data.urls[0];
  let feed = data.initialFeed;
  let widgetContainer;

  onMount(() => {
    // Initialize window.Mula and set up the feed data
    window.Mula = Object.assign({}, window.Mula, {
      organicConfig: {
        smartScroll: [
          {
            feedLength: 40,
            loadMoreButton: true
          }
        ]
      }
    }) || {};
    const initialFeedData = document.body.getAttribute('data-initial-feed');
    if (initialFeedData) {
      window.Mula.feed = JSON.parse(initialFeedData);
    }

    // Create and inject the widgets after feed is available
    const qaWidget = document.createElement('mula-qa');
    qaWidget.setAttribute('cdn-url', 'http://localhost:3010/data');
    qaWidget.setAttribute('page-url', url);


    const topshelf = document.createElement('mula-topshelf');
    topshelf.setAttribute('feed_url', url);

    const smartscroll = document.createElement('mula-smartscroll');
    smartscroll.setAttribute('feed_url', url);

    // Append widgets to the container
    widgetContainer.appendChild(qaWidget);
    widgetContainer.appendChild(topshelf);
    widgetContainer.appendChild(smartscroll);
  });

  const setUrl = async (u) => {
    url = u;
    try {
      feed = await loadFeed(u, "http://localhost:3010/data");
      // Update window.Mula.feed for the custom elements
      if (typeof window !== 'undefined') {
        window.Mula.feed = feed;
      }
    } catch (error) {
      console.error('Error loading feed:', error);
    }
  };
</script>

<body data-initial-feed={JSON.stringify(data.initialFeed)}>
<a href="https://www.engadget.com/home/smart-home/best-smart-scale-160033523.html" target="_blank">Test Link</a>
<h1>Mula Test Page</h1>
<ul>
{#each data.urls as url}
  <li><a href="javascript:void(0)" on:click={() => {setUrl(url)}}>{url}</a></li>
{/each}
</ul>
<div bind:this={widgetContainer}>
  <!-- Widgets will be injected here -->
</div>
<!-- <link rel="stylesheet" href="/public/pubs/stylecaster.com/style.css"> -->
<!-- <mula-feed feed_url={url} layout="horizontal"></mula-feed> -->
<!-- <mula-feed feed_url={url} layout="vertical"></mula-feed> -->
</body>
