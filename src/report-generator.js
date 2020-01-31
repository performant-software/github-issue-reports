var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var moment = require('moment');
var dateFormat = require('dateformat');
var jade = require('jade');
var rp = require('request-promise');
var Buffer = require('buffer').Buffer;

function getReportName(repo, owner) {
  return [
    owner,
    '_',
    repo,
    '-',
    dateFormat(new Date(), 'yyyymdd-HHMMss'),
    '.html'
  ].join('');
}


module.exports = {
  generate: (config) => {

    function generateAuthorization(token) {
        return 'Basic ' + new Buffer(token + ':x-oauth-basic').toString('base64');
    }

    const zhOptions = {
        uri: 'https://api.zenhub.com/p1/reports/release/5e309e4032970b6af25e726c/issues',
        headers: {
            'X-Authentication-Token': config.ztoken
        }
    };

    const ghOptions = {
        // TODO: the repo ID & issue # needs to be determined dynamically
        uri: 'https://api.github.com/repos/performant-software/3dfleet-client-lib/issues',
        headers: {
            'User-Agent': 'github-issue-reports',
            'Authentication': config.gtoken
        }
    }

    rp(zhOptions)
        .then(results => {
            let parsedResults = JSON.parse(results)
            console.log('1st then')
            console.log(parsedResults)
            return rp(ghOptions)
                .then(details => {
                    console.log(details)
                })
        })
        .catch(function (err) {
          console.log("ERROR!!")
          console.log(err)
        });

  }
};

