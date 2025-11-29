const filloutProduct = async () => {
	const response = await fetch('https://cdn.makemula.ai/www.brit.co/pages/77a541066cf473bb25ecdff124229714399b723ca666ef1413c2a8036fc5b7b0/index.json')
	const results = await response.json();
	for(let i in results.shopping_results) {
		const result = results.shopping_results[i];
		console.log(`fetching ${result.product_id}`);
		const detailResponse = await fetch(`https://cdn.makemula.ai/products/${result.product_id}/immersive.json`);
		const detailResult = await detailResponse.json();
		result.brand = detailResult.product_results.brand;
		result.about_the_product = detailResult.product_results.about_the_product;
		result.stores = detailResult.product_results.stores;
	}
	require('fs').writeFileSync("./index.json", JSON.stringify(results));
};

filloutProduct();
