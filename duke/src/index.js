#!/usr/bin/env node

const { program } = require('commander');
const { DukeOnboarding } = require('./onboard');

program
  .name('duke')
  .description('Duke - Onboarding & Placement Intelligence Agent')
  .version('1.0.0');

program
  .command('onboard <domain>')
  .description('Run onboarding analysis for a domain')
  .option('-m, --max-urls <number>', 'Maximum URLs to analyze', '15000')
  .action(async (domain, options) => {
    const maxUrls = parseInt(options.maxUrls) || 15000;
    const analyzer = new DukeOnboarding();
    
    try {
      await analyzer.analyze(domain, { maxUrls });
      process.exit(0);
    } catch (error) {
      console.error(`\n❌ Onboarding failed: ${error.message}\n`);
      process.exit(1);
    }
  });

program.parse();

