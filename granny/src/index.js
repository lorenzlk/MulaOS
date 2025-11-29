#!/usr/bin/env node

const { Command } = require('commander');
const { GrannyContext } = require('./context');

const program = new Command();

program
  .name('granny')
  .description('Granny - Publisher Context Intelligence Agent')
  .version('1.0.0');

program
  .command('context <domain>')
  .description('Get contextual intelligence (business context, sports calendar, affiliate strategies)')
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

