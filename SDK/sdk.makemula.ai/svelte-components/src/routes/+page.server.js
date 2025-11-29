import { loadFeed } from '$lib/FeedStore.js';

export async function load() {
    const urls = [
        'https://www.dreadcentral.com/interviews/520558/grace-glowicki-unearths-her-dead-lover-sundance-2025-interview/ ',
        'https://www.brit.co/old-school-beauty-products/',
        'https://www.hollywoodreporter.com/lifestyle/shopping/best-comfortable-pants-for-women-1235049939/',
        'https://www.harpersbazaar.com/fashion/trends/g40859795/best-cross-body-bags-for-women',
        'https://comicbook.com/gaming/news/ps5-playstation-5-store-free-game/',
        'https://www.engadget.com/home/smart-home/best-smart-scale-160033523.html',
        'https://www.dreadcentral.com/editorials/520388/5-gross-horror-movies-that-will-make-you-sick/',
        'https://comicbook.com/gaming/news/helldivers-2-director-teases-next-arrowhead-game/',
        'https://www.harpersbazaar.com/fashion/trends/g45899651/best-puffer-vests-for-women/',
        'https://www.engadget.com/cameras/best-cameras-151524327.html'
    ];

    // Load feed for the first URL
    const initialFeed = await loadFeed(urls[0], "http://localhost:3010/data");

    return {
        urls,
        initialFeed
    };
} 