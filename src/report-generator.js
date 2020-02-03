const fs = require('fs');
const path = require('path');
const moment = require('moment');
const dateFormat = require('dateformat');
const jade = require('jade');
const rp = require('request-promise');
const Buffer = require('buffer').Buffer;

const generateGhAuthorization = (token) => {
    return 'Basic ' + new Buffer(token + ':x-oauth-basic').toString('base64');
};

const getReportName = () => {
    return [
        'Performant Software',
        '_',
        'GNB',
        '-',
        dateFormat(new Date(), 'yyyymdd-HHMMss'),
        '.html'
    ].join('');
};

// TODO: Get release by searching for certain release title
// TODO: Get issue comments w/o images
// TODO: Write to JSON file

module.exports = {
  generate: (config) => {

      const zhOptions = {
          uri: 'https://api.zenhub.com/p1/reports/release/5e309e4032970b6af25e726c/issues',
          headers: {
              'X-Authentication-Token': config.ztoken
          }
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
              const issueOptionsArr = issuesNumberArr.map((number, i) => {
                  let ghOptionsCopy = {...ghOptions};
                  ghOptionsCopy.uri = ghOptionsCopy.uri + issuesNumberArr[i];
                  return ghOptionsCopy;
              });
              return issueOptionsArr;
          })
          .then(optionsArr => {
              const issuesDataPromises = optionsArr.map(optionsObj => {

                  return rp(optionsObj).then(data => {
                     return JSON.parse(data)
                  })

              });
              return Promise.all(issuesDataPromises)
          })
          .then(issuesArr => {

              const runDate = moment();

              const issues = issuesArr.map(issue => {
                  return {
                      url: issue.html_url,
                      number: issue.number,
                      title: issue.title,
                      createdAt: moment(issue.created_at),
                      comments: issue.comments,
                      closedAt: moment(issue.closed_at),
                      body: issue.body,
                      state: issue.state,
                      labels: issue.labels.map(label => label.name)
                  }
              });

              const templatePath = path.join(__dirname, 'report.jade');
              const template = jade.compileFile(templatePath);

              const context = {
                  issues: issues,
                  runDate: runDate
              };

              const html = template(context);

              const fileName = getReportName();

              fs.writeFile(fileName, html, function (err) {
                  if (err) {
                      console.log(err);
                  } else {
                      console.log('Generated issue report %s', fileName);
                  }
              });

          })

          .catch(function (err) {
          console.log("ERROR!!");
          console.log(err)
        });

  }
};

