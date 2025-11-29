const generateMarkdown = async (mulaRecommendationsUrl) => {
    const mulaRecommendationsResponse = await fetch(mulaRecommendationsUrl);
    if(!mulaRecommendationsResponse.ok) {
        throw new Error(`Error fetching recommendations from ${mulaRecommendationsUrl}`);
    }
    const recommendations = await mulaRecommendationsResponse.json();
    const products = recommendations["shopping_results"];
    let markdown = '';
    for(let i in products) {
        const product = products[i];
        markdown += `## ${product.title}\n\n`;
        markdown += `[![${product.title}](${product.thumbnails[0]} "${product.title}")](${product.product_link})\n\n`;
        markdown += `${product.description}\n\n`;
        markdown += `[Price on ${product.source}: ${product.price}](${product.product_link})\n\n`;
        markdown += `${(product.extensions || []).join(", ")}\n\n`;
    }
    console.log(markdown);
};
