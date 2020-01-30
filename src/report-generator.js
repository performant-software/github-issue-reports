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
    const options = {
      uri: 'https://api.zenhub.com/p1/reports/release/5e309e4032970b6af25e726c/issues',
      headers: {
        'X-Authentication-Token': config.token
      }
    };

    rp(options)
        .then((results) => {
          let parseResults = JSON.parse(results);
          console.log('SUCCESS')
          console.log(parseResults)
        })
        .catch(function (err) {
          console.log("ERROR!!")
        });
  }
};

