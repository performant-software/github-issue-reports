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

      const zhOptions = {
          uri: 'https://api.zenhub.com/p1/reports/release/5e309e4032970b6af25e726c/issues',
          headers: {
              'X-Authentication-Token': config.ztoken
          }
      };

      const generateGhAuthorization = (token) => {
          return 'Basic ' + new Buffer(token + ':x-oauth-basic').toString('base64');
      };

      const ghOptions = {
          uri: 'https://api.github.com/repos/performant-software/3DFleet/issues/',
          headers: {
              'User-Agent': 'github-issue-reports',
          }
      };

      if (config.gtoken) {
          ghOptions.headers['Authorization'] = generateGhAuthorization(config.gtoken);
      }

      rp(zhOptions)
          .then(response => JSON.parse(response))
          .then(json => json.map(issue => issue.issue_number))
          .then(issuesNumberArr => {
              let issueOptionsArr = issuesNumberArr.map((number, i) => {
                  let ghOptionsCopy = {...ghOptions};
                  ghOptionsCopy.uri = ghOptionsCopy.uri + issuesNumberArr[i];
                  return ghOptionsCopy;
              });
              return issueOptionsArr;
          })
          .then(optionsArr => {
              let issuesDataPromises = optionsArr.map((optionsObj, i) => {

                  return rp(optionsObj).then(data => {
                     return JSON.parse(data)
                  })

              });
              return Promise.all(issuesDataPromises)
          })
          .then(issuesArr => {
              console.log(issuesArr)
          })

          .catch(function (err) {
          console.log("ERROR!!");
          console.log(err)
        });

  }
};

