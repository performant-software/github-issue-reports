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

      // const promise1 = Promise.resolve(3);
      // const promise2 = 42;
      // const promise3 = new Promise(function(resolve, reject) {
      //     setTimeout(resolve, 100, 'foo');
      // });
      //
      // Promise.all([promise1, promise2, promise3]).then(function(values) {
      //     console.log('PROMISE ALL');
      //     console.log(values);
      // });

      rp(zhOptions)
          .then(response => JSON.parse(response))
          .then(json => json.map(issue => issue.issue_number))
          .then(issuesNumberArr => {
              let issueOptionsArr = issuesNumberArr.map((number, i) => {
                  let ghOptionsCopy = {...ghOptions};
                  ghOptionsCopy.uri = ghOptionsCopy.uri + issuesNumberArr[i]
                  return ghOptionsCopy;
              })
              return issueOptionsArr;
          })
          .then(optionsArr => {
              let issuesData = optionsArr.map((optionsObj, i) => {

                  return rp(optionsObj).then(data => {
                     return data
                  })

              })
              return Promise.all(issuesData)
          })
          .then(end => {
              console.log(end)
          })




        //
        //     let ghIssuesData =
        //     ghIssueOptionsList.map((options, i) => {
        //         return rp(options)
        //             .then(issue => {
        //                 return JSON.parse(issue)
        //             })
        //     });
        //         return Promise.all(issueList => {
        //             console.log(issueList)
        //         })
        // })
          .catch(function (err) {
          console.log("ERROR!!");
          console.log(err)
        });

  }
};

