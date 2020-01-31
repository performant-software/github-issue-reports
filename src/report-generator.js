var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var moment = require('moment');
var dateFormat = require('dateformat');
var jade = require('jade');
var rp = require('request-promise');
var Buffer = require('buffer').Buffer;

function generateAuthorization(token) {
    return 'Basic ' + new Buffer(token + ':x-oauth-basic').toString('base64');
}

module.exports = {
  generate: (config) => {

      const generateAuthorization = (token) => {
          return 'Basic ' + new Buffer(token + ':x-oauth-basic').toString('base64');
      };

      const zhOptions = {
          uri: 'https://api.zenhub.com/p1/reports/release/5e309e4032970b6af25e726c/issues',
          headers: {
              'X-Authentication-Token': config.ztoken
          }
      };

      const ghOptions = {
          // TODO: the repo ID & issue # needs to be determined dynamically
          uri: 'https://api.github.com/repos/performant-software/3DFleet/issues/',
          headers: {
              'User-Agent': 'github-issue-reports',
          }
      };
      const getGhOptions = issueNumber => {
          uri: ghOptions.uri + issueNumber
      }


      if (config.gtoken) {
          ghOptions.headers['Authorization'] = generateAuthorization(config.gtoken);
      }

      rp(zhOptions)
          .then(results => {
            let parsedResults = JSON.parse(results);
            let issuesNumbers = parsedResults.map(issue => issue.issue_number);
            console.log('1st then');
            console.log(parsedResults);
            console.log(issuesNumbers);
            let ghUriIssueList = issuesNumbers.map((number, i) => {
                let ghOptionsCopy = {...ghOptions};
                return ghOptionsCopy.uri = ghOptionsCopy.uri + issuesNumbers[i]
            });
              console.log(ghUriIssueList);
            // return rp(ghOptions)
        })
          .then(details => {
          console.log(JSON.parse(details))
        })
          .catch(function (err) {
          console.log("ERROR!!");
          console.log(err)
        });

  }
};

