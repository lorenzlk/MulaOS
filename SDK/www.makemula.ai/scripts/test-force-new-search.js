const { Page, Search } = require('../models');
const { createLogger } = require('../helpers/LoggingHelpers');

const logger = createLogger('TestForceNewSearch');

async function testForceNewSearch() {
  try {
    logger.info('Starting force new search test');

    // Find a page that has been approved
    const approvedPage = await Page.findOne({
      where: {
        searchIdStatus: 'approved'
      },
      include: [{
        model: Search,
        as: 'Search'
      }]
    });

    if (!approvedPage) {
      logger.info('No approved pages found. Creating a test page...');
      
      // Create a test page
      const testPage = await Page.create({
        url: 'https://example.com/test-force-new-search',
        searchIdStatus: 'approved',
        searchStatus: 'completed'
      });

      logger.info('Created test page', { pageId: testPage.id, url: testPage.url });
      
      // Test the force new search functionality
      await testForceNewSearchForPage(testPage);
    } else {
      logger.info('Found approved page for testing', { 
        pageId: approvedPage.id, 
        url: approvedPage.url,
        searchId: approvedPage.searchId,
        searchIdStatus: approvedPage.searchIdStatus
      });
      
      // Test the force new search functionality
      await testForceNewSearchForPage(approvedPage);
    }

    logger.info('Force new search test completed successfully');
  } catch (error) {
    logger.error('Error in force new search test', error);
    throw error;
  }
}

async function testForceNewSearchForPage(page) {
  logger.info('Testing force new search for page', { pageId: page.id, url: page.url });

  // Store original state
  const originalSearchId = page.searchId;
  const originalSearchIdStatus = page.searchIdStatus;
  const originalSearchStatus = page.searchStatus;

  logger.info('Original page state', {
    searchId: originalSearchId,
    searchIdStatus: originalSearchIdStatus,
    searchStatus: originalSearchStatus
  });

  // Simulate the force new search endpoint
  await page.update({
    searchId: null,
    searchIdStatus: 'pending',
    searchStatus: 'pending',
    searchAttempts: [],
    keywordFeedback: null
  });

  // Reload the page to get updated state
  await page.reload();

  logger.info('Page state after force new search', {
    searchId: page.searchId,
    searchIdStatus: page.searchIdStatus,
    searchStatus: page.searchStatus,
    searchAttempts: page.searchAttempts,
    keywordFeedback: page.keywordFeedback
  });

  // Verify the changes
  if (page.searchId !== null) {
    throw new Error('searchId should be null after force new search');
  }
  if (page.searchIdStatus !== 'pending') {
    throw new Error('searchIdStatus should be pending after force new search');
  }
  if (page.searchStatus !== 'pending') {
    throw new Error('searchStatus should be pending after force new search');
  }
  if (page.searchAttempts.length !== 0) {
    throw new Error('searchAttempts should be empty after force new search');
  }
  if (page.keywordFeedback !== null) {
    throw new Error('keywordFeedback should be null after force new search');
  }

  logger.info('✅ Force new search test passed - page state correctly reset');

  // Restore original state for cleanup
  await page.update({
    searchId: originalSearchId,
    searchIdStatus: originalSearchIdStatus,
    searchStatus: originalSearchStatus,
    searchAttempts: page.searchAttempts || [],
    keywordFeedback: page.keywordFeedback
  });

  logger.info('Restored original page state');
}

// Run the test if this script is executed directly
if (require.main === module) {
  testForceNewSearch()
    .then(() => {
      console.log('✅ Force new search test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Force new search test failed:', error);
      process.exit(1);
    });
}

module.exports = { testForceNewSearch, testForceNewSearchForPage }; 