const { createEncore } = require('../../services/encore');
const { Page } = require('../../models');

// Get the URL from the command line arguments
const urlArg = process.argv[2];

if (!urlArg) {
  console.error('Error: Please provide a URL as a command-line argument.');
  console.error('Usage: node ./scripts/createEncore.js <URL>');
  process.exit(1);
}

try {
  const url = new URL(urlArg);
  
  // Find or create the page
  const page = await Page.findOne({ where: { url: url.toString() } });
  if (!page) {
    console.error('Error: Page not found for the given URL.');
    process.exit(1);
  }

  await createEncore(page);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}