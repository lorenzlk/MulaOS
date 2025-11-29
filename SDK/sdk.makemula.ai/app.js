// Import the required module
const express = require('express');
const path = require('path');

// Create an Express application
const app = express();

// Define the port the server will run on
const PORT = process.env.PORT || 3001;

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle all other routes by serving the index.html file (useful for SPA routing)
app.get('*', (req, res) => {
  return res.status(404).end();
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
