#! /usr/bin/env node

var packageJson = require('../package.json');
var program = require('commander');

program
  .version(packageJson.version)
  .usage('[-z <ztoken>]')
  // .option('-o, --owner <value>', 'owner of the repo')
  // .option('-r, --repo <value>', 'name of the repo')
  .option('-z, --ztoken [value]', 'Zenhub API access token')
  .option('-g, --gtoken [value]', 'Github API access token')
  .parse(process.argv);

// if (!program.owner || !program.repo) {
//   program.help();
//
// } else {
  var options = {
    // owner: program.owner,
    // repo: program.repo,
    ztoken: program.ztoken,
    gtoken: program.gtoken
  };

  var reporter = require('../src/report-generator');
  reporter.generate(options);
// }
