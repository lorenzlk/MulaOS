const fs = require('fs');
const path = require('path');

// Get the current directory
const directoryPath = __dirname;

// Get all the files in the directory
const files = fs.readdirSync(directoryPath);

// Array to hold the required modules
const modules = [];

// Loop through the files and require each one
files.forEach(file => {
  // Skip the index.js file itself
  if (file !== 'index.js' && file.endsWith('.js')) {
    const filePath = path.join(directoryPath, file);
    const module = require(filePath);
    modules.push(module);
  }
});

// Export the modules array
module.exports = modules;
