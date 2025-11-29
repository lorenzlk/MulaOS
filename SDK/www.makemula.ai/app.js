require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3010;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({
  verify: (req, res, buf) => {
    req.rawBody = buf; // capture the raw body buffer before parsing
  },
  extended: true
}));
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf; // capture the raw body buffer before parsing
  },
  limit: '10mb'
}));
app.use(express.static('public'));  // Serve static files from public directory

// View Engine
const { create } = require('express-handlebars');
const hbs = create({ 
  defaultLayout: 'main', 
  layoutsDir: './views/layouts',
  helpers: {
    formatDate: (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    eq: (v1, v2) => v1 === v2,
    multiply: (a, b) => a * b
  }
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', './views');

// Routes
app.use('/', routes);

// Error Handling
app.use(errorHandler);

// Start Server
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
    await sequelize.sync();
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  } catch (error) {
    console.error('Failed to start server:', error);
  }
})();
