const express = require('express');
const path = require('path');
const pagesRoutes = require('./pages');
const slackRoutes = require('./slack');
const searchesRoutes = require('./searches');

const router = express.Router();
// Resolve the ./data directory to an absolute path
const dataDir = path.join(__dirname, '../data');

// Serve the ./data directory as static content
router.use('/data', express.static(dataDir));

// Mount Slack routes under /slack prefix
router.use('/slack', slackRoutes);

router.use(pagesRoutes);
router.use(searchesRoutes);

// Home Route
router.get('/', require('../middlewares/auth'), (req, res) => {
  res.render('home/index', { layout: 'home' });
});

module.exports = router;
