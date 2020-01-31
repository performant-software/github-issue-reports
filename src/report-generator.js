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

    const issuesInReleaseURI = 'https://api.zenhub.com/p1/reports/release/5e309e4032970b6af25e726c/issues'
    const issuesDetail = 'https://api.zenhub.com/p1/repositories/132477468/issues/459'

    const getOptions = (uri) => {
        return {
            uri: uri,
            headers: {
                'X-Authentication-Token': config.token
            }
        }
    }

    rp(getOptions(issuesInReleaseURI))
        .then(results => {
            let parsedResults = JSON.parse(results)
            console.log('1st then')
            console.log(parsedResults)
            return rp(getOptions(issuesDetail))
                .then(details => {
                    console.log(details)
                })
        })
        .catch(function (err) {
          console.log("ERROR!!")
        });

  }
};

