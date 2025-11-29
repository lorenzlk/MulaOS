const express = require('express');
const Bull = require('bull');
const { Search } = require('../models');
const auth = require('../middlewares/auth');
const { approveSearch } = require('../helpers/SearchApprovalHelpers');
const { getCredentialIds, getCredentialNames } = require('../config/credentials');

const redisUrl = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';
const searchQueue = new Bull('searchQueue', redisUrl);

const router = express.Router();

// List all searches
router.get('/searches', auth, async (req, res) => {
  try {
    const searches = await Search.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    // Get credential names for display
    const amazonCredentialNames = getCredentialNames('amazon');
    const impactCredentialNames = getCredentialNames('impact');
    
    // Add URL information and credential names for each search
    const searchesWithUrls = searches.map(search => {
      const searchData = search.toJSON();
      
      // Add credential display name
      if (search.credentialId) {
        if (search.platform === 'amazon') {
          searchData.credentialName = amazonCredentialNames[search.credentialId] || search.credentialId;
        } else if (search.platform === 'fanatics') {
          searchData.credentialName = impactCredentialNames[search.credentialId] || search.credentialId;
        } else {
          searchData.credentialName = search.credentialId;
        }
      }
      
      // Add URLs if search has phraseID
      if (search.phraseID) {
        const baseUrl = `https://cdn.makemula.ai/searches/${search.phraseID}`;
        searchData.resultsJsonUrl = `${baseUrl}/results.json`;
        searchData.tempResultsUrl = `${baseUrl}/temp-recommendations.json`;
        
        // Determine what to show based on status
        // 'completed' means temp results exist, but we don't know about final results
        // We'll let the frontend handle checking for final results if needed
        searchData.hasTempResults = search.status === 'completed';
      }
      
      return searchData;
    });
    
    res.render('searches/index', { searches: searchesWithUrls });
  } catch (error) {
    res.status(500).render('error', { 
      message: 'Error fetching searches',
      error: process.env.NODE_ENV === 'development' ? error : null
    });
  }
});

// Show search form
router.get('/searches/new', auth, (req, res) => {
  const amazonCredentialIds = getCredentialIds('amazon');
  const amazonCredentialNames = getCredentialNames('amazon');
  const impactCredentialIds = getCredentialIds('impact');
  const impactCredentialNames = getCredentialNames('impact');
  
  // Transform to match /pages format
  const amazonCredentials = amazonCredentialIds.map(id => ({
    id,
    name: amazonCredentialNames[id]
  }));
  const impactCredentials = impactCredentialIds.map(id => ({
    id,
    name: impactCredentialNames[id]
  }));
  
  res.render('searches/new', {
    amazonCredentials,
    impactCredentials
  });
});

// Create new search
router.post('/searches', auth, async (req, res) => {
  try {
    const platform = req.body.platform || 'amazon'; // Default to amazon if not specified
    const credentialId = req.body.credentialId;
    
    // Validate credentialId is provided for all platforms
    if (!credentialId) {
      const amazonCredentialIds = getCredentialIds('amazon');
      const amazonCredentialNames = getCredentialNames('amazon');
      const impactCredentialIds = getCredentialIds('impact');
      const impactCredentialNames = getCredentialNames('impact');
      
      return res.status(400).render('searches/new', { 
        error: `Credentials are required for platform: ${platform}`,
        phrase: req.body.phrase,
        platform: platform,
        amazonCredentialIds,
        amazonCredentialNames,
        impactCredentialIds,
        impactCredentialNames
      });
    }
    
    const finalCredentialId = credentialId;
    
    // Configure platform-specific settings
    let platformConfig;
    if (platform === 'amazon') {
      platformConfig = { 
        searchIndex: 'All',
        credentialId: finalCredentialId
      };
    } else if (platform === 'fanatics') {
      platformConfig = {}; // Fanatics doesn't use searchIndex or credentials
    } else if (platform === 'google_shopping') {
      platformConfig = {}; // Google Shopping doesn't use searchIndex or credentials
    } else {
      platformConfig = { searchIndex: 'All' }; // Default fallback
    }
    
    // Generate phraseID using the same logic as SearchOrchestrator
    const crypto = require('crypto');
    const phraseIdInput = [
      req.body.phrase.toLowerCase(),
      platform,
      JSON.stringify(platformConfig),
      finalCredentialId
    ].join('|');
    const phraseID = crypto.createHash('sha256').update(phraseIdInput).digest('hex');
    
    // Use findOrCreate to handle duplicate searches gracefully
    const [search, created] = await Search.findOrCreate({
      where: {
        phrase: req.body.phrase,
        platform: platform,
        platformConfig: platformConfig
      },
      defaults: {
        phraseID: phraseID,
        status: 'pending',
        platformConfig: platformConfig,
        credentialId: finalCredentialId
      }
    });
    
    if (created) {
      // Only add to queue if this is a new search
      await searchQueue.add('search', { searchId: search.id });
    } else {
      // If search already exists, update status to pending for retry
      await search.update({ status: 'pending' });
      await searchQueue.add('search', { searchId: search.id });
    }
    
    res.redirect('/searches');
  } catch (error) {
    console.error('Error creating search:', error);
    const amazonCredentialIds = getCredentialIds('amazon');
    const amazonCredentialNames = getCredentialNames('amazon');
    const impactCredentialIds = getCredentialIds('impact');
    const impactCredentialNames = getCredentialNames('impact');
    
    res.status(400).render('searches/new', { 
      error: 'Error creating search: ' + error.message,
      phrase: req.body.phrase,
      platform: req.body.platform || 'amazon',
      credentialId: req.body.credentialId,
      amazonCredentialIds,
      amazonCredentialNames,
      impactCredentialIds,
      impactCredentialNames
    });
  }
});

// Show search details
router.get('/searches/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that id is a valid integer
    if (!id || id === 'null' || isNaN(parseInt(id))) {
      return res.status(400).render('error', { 
        message: 'Invalid search ID',
        error: { status: 400 }
      });
    }
    
    const search = await Search.findByPk(id);
    if (!search) {
      return res.status(404).render('error', { message: 'Search not found' });
    }
    
    // Add credential display name
    const searchData = search.toJSON();
    if (search.credentialId) {
      const amazonCredentialNames = getCredentialNames('amazon');
      const impactCredentialNames = getCredentialNames('impact');
      
      if (search.platform === 'amazon') {
        searchData.credentialName = amazonCredentialNames[search.credentialId] || search.credentialId;
      } else if (search.platform === 'fanatics') {
        searchData.credentialName = impactCredentialNames[search.credentialId] || search.credentialId;
      } else {
        searchData.credentialName = search.credentialId;
      }
    }
    
    res.render('searches/show', { search: searchData });
  } catch (error) {
    res.status(500).render('error', { 
      message: 'Error fetching search',
      error: process.env.NODE_ENV === 'development' ? error : null
    });
  }
});

// Approve search
router.post('/searches/:id/approve', auth, async (req, res) => {
  try {
    const searchId = req.params.id;
    
    // Validate that id is a valid integer
    if (!searchId || searchId === 'null' || isNaN(parseInt(searchId))) {
      return res.status(400).json({ error: 'Invalid search ID' });
    }
    
    await approveSearch(searchId);
    res.status(200).json({ message: 'Search approved successfully' });
  } catch (error) {
    console.error('Error approving search:', error);
    res.status(500).json({ error: 'Error approving search' });
  }
});

// Reject search
router.post('/searches/:id/reject', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that id is a valid integer
    if (!id || id === 'null' || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid search ID' });
    }
    
    const search = await Search.findByPk(id);
    if (!search) {
      return res.status(404).json({ error: 'Search not found' });
    }
    
    const { feedback } = req.body;
    await search.update({ 
      status: 'rejected',
      keywordFeedback: feedback || null
    });
    
    res.status(200).json({ message: 'Search rejected successfully' });
  } catch (error) {
    console.error('Error rejecting search:', error);
    res.status(500).json({ error: 'Error rejecting search' });
  }
});

// Retry search
router.post('/searches/:id/retry', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that id is a valid integer
    if (!id || id === 'null' || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid search ID' });
    }
    
    const search = await Search.findByPk(id);
    if (!search) {
      return res.status(404).json({ error: 'Search not found' });
    }

    // Check if search can be retried (completed, failed, or rejected)
    if (!['completed', 'failed', 'rejected'].includes(search.status)) {
      return res.status(400).json({ error: 'Search cannot be retried in its current status' });
    }

    // Update search status to pending
    await search.update({ status: 'pending' });
    
    // Add to search queue for processing
    await searchQueue.add('search', { searchId: search.id });
    
    res.status(200).json({ 
      message: 'Search retry initiated successfully',
      searchId: search.id,
      status: 'pending'
    });
  } catch (error) {
    console.error('Error retrying search:', error);
    res.status(500).json({ error: 'Error retrying search' });
  }
});

// Delete search
router.delete('/searches/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that id is a valid integer
    if (!id || id === 'null' || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid search ID' });
    }
    
    const search = await Search.findByPk(id);
    if (!search) {
      return res.status(404).json({ error: 'Search not found' });
    }
    await search.destroy();
    res.status(200).json({ message: 'Search deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting search' });
  }
});

module.exports = router; 