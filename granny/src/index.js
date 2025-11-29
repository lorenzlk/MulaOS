#!/usr/bin/env node

const { Command } = require('commander');
const { GrannyOnboarding } = require('./onboard');
const { GrannyContext } = require('./context');

const program = new Command();

program
  .name('granny')
  .description('Granny - Publisher Intelligence Agent for Mula')
  .version('1.0.0');

program
  .command('onboard <domain>')
  .description('Technical onboarding: SDK health check + traffic analysis + URL patterns')
  .option('-u, --max-urls <number>', 'Maximum URLs to analyze', '15000')
  .action(async (domain, options) => {
    const analyzer = new GrannyOnboarding();
    try {
      await analyzer.analyze(domain, { maxUrls: parseInt(options.maxUrls) });
      process.exit(0);
    } catch (error) {
      console.error(`\n❌ Onboarding failed: ${error.message}\n`);
      process.exit(1);
    }
  });

program
  .command('context <domain>')
  .description('Business context analysis: market position + revenue model + opportunities')
  .option('-d, --deep', 'Include deep competitive analysis')
  .action(async (domain, options) => {
    const analyzer = new GrannyContext();
    try {
      await analyzer.analyze(domain, { deep: options.deep });
      process.exit(0);
    } catch (error) {
      console.error(`\n❌ Context analysis failed: ${error.message}\n`);
      process.exit(1);
    }
  });

program.parse();

