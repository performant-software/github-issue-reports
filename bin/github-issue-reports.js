#! /usr/bin/env node

var packageJson = require('../package.json');
var program = require('commander');

program
  .version(packageJson.version)
  .option('-r, --rel <value>', 'Zenhub release title')
  .option('-z, --ztoken <value>', 'Zenhub API access token')
  .option('-g, --gtoken <value>', 'Github API access token')
  .parse(process.argv);

  var options = {
    rel: program.rel,
    ztoken: program.ztoken,
    gtoken: program.gtoken
  };

  var reporter = require('../src/report-generator');
  reporter.generate(options);
// }
