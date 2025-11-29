import { writable, get } from 'svelte/store';
import { createSHA256Hash } from './URLHelpers';
const feed = {};
export const feedStore = writable(feed);
export const getImmersiveProductUrl = async (page_url, product_id) => {
  const cdn_url = import.meta.env.VITE_PUBLIC_MULA_CDN_ROOT;
  const u = new URL(page_url);
  const hash = await createSHA256Hash(u.pathname);
  return `${cdn_url}/products/${product_id}/immersive.json`;
};
export const loadFeed = async (page_url, cdn_url) => {
  if(get(feedStore)[page_url]) {
    // console.log("feedstore cache...", get(feedStore)[page_url]);
    return get(feedStore)[page_url];
  }
  let u = new URL(page_url);
  let mulaPageRecommendationsUrl;
  let mulaPageRecommendationsResponse;
  if(page_url.toString().startsWith(import.meta.env.VITE_PUBLIC_MULA_CDN_ROOT)) {
    mulaPageRecommendationsUrl = page_url;
  } else {
    cdn_url ||= import.meta.env.VITE_PUBLIC_MULA_CDN_ROOT;
  
    const hash = await createSHA256Hash(u.pathname);
    mulaPageRecommendationsUrl = `${cdn_url}/${u.hostname}/pages/${hash}/index.json`;
  }

  mulaPageRecommendationsResponse = await fetch(mulaPageRecommendationsUrl);

  if(!mulaPageRecommendationsResponse.ok) {
    //check the root domain if its www
    if(u.hostname.startsWith("www") && !mulaPageRecommendationsUrl.startsWith(import.meta.env.VITE_PUBLIC_MULA_CDN_ROOT)) {
      mulaPageRecommendationsUrl = `${cdn_url}/${u.hostname.replace("www.", "")}/pages/${hash}/index.json`;
      mulaPageRecommendationsResponse = await fetch(mulaPageRecommendationsUrl);
    }
  }

  if(mulaPageRecommendationsResponse.ok) {
    const mulaPageRecommendations = await mulaPageRecommendationsResponse.json();
    for(let i in mulaPageRecommendations.shopping_results) {
      const item = mulaPageRecommendations.shopping_results[i];
      item.immersive_url = await getImmersiveProductUrl(page_url, item.product_id);
      item.id = item.product_id;
    }

    feedStore.update((value) => {
      value[page_url] = mulaPageRecommendations.shopping_results.sort((a, b) => {
        // Default values if null (treat null rating as -1, and null reviews as 0)
        const ratingA = a.rating ?? -1;
        const ratingB = b.rating ?? -1;
        const reviewsA = a.reviews ?? 0;
        const reviewsB = b.reviews ?? 0;

        // Bucket reviews into orders of magnitude
        const bucketA = reviewsA >= 100 ? 3 : reviewsA >= 10 ? 2 : 1;
        const bucketB = reviewsB >= 100 ? 3 : reviewsB >= 10 ? 2 : 1;

        // First, sort by review bucket in descending order (higher bucket first)
        if (bucketA !== bucketB) {
            return bucketB - bucketA; // Higher bucket first
        }

        // If buckets are the same, sort by rating in descending order
        return ratingB - ratingA;
      });
      return value;
    }); 
    
    return mulaPageRecommendations.shopping_results;
  }
  return [];
};
