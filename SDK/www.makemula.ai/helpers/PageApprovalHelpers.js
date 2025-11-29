const { Page, Search } = require('../models');
const { getSearchURLs } = require('./URLHelpers');
const { uploadJsonToS3 } = require('./S3Helpers');

async function approvePageSearch(pageId) {
  const page = await Page.findByPk(pageId);
  if (!page || !page.searchId) throw new Error('Page or search not found');
  const search = await Search.findByPk(page.searchId);
  if (!search) throw new Error('Search not found');
  const urls = await getSearchURLs(search);

  // Check if results.json already exists
  let resultsExists = false;
  try {
    const resultsResponse = await fetch(urls.mulaRecommendationsUrl);
    if (resultsResponse.ok) {
      resultsExists = true;
    }
  } catch (e) {}

  if (!resultsExists) {
    // Copy temp-recommendations.json to results.json
    const tempResponse = await fetch(urls.tempRecommendationsUrl);
    if (!tempResponse.ok) throw new Error('Temporary recommendations not found');
    const tempRecommendations = await tempResponse.json();
    await uploadJsonToS3(urls.mulaRecommendationsUrl, tempRecommendations);
  }

  // Update status
  await page.update({ searchIdStatus: 'approved' });
  return { approved: true, alreadyApproved: resultsExists };
}

module.exports = { approvePageSearch }; 