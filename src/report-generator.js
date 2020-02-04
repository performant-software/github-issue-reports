const fs = require('fs');
const path = require('path');
const moment = require('moment');
const dateFormat = require('dateformat');
const jade = require('jade');
const rp = require('request-promise');


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

const repos = [
    {title: "3dfleet-measure", zhId: 101790762},
    {title: "3dfleet-portal", zhId: 101790742},
    {title: "3dfleet-config", zhId: 119548629},
    {title: "3DFleet", zhId: 132477468},
    {title: "3dfleet-monitor", zhId: 101790911},
    {title: "3dfleet-connect-http", zhId: 128769009},
    {title: "3dfleet-model", zhId: 101790788},
    {title: "3dfleet-client-lib", zhId: 133864410},
    {title: "prince", zhId: 150171331},
    {title: "3dfleet-projects", zhId: 151473699},
    {title: "charger-monitor", zhId: 132938765},
];

const findRepoTitle = zhRepoId => repos.filter(repo => repo.zhId === zhRepoId)[0].title

const zenhub = {
    root: 'https://api.zenhub.com',
    PrimaryRepoId: "132477468",
    token: null,
    getAllReleaseReports: repoId =>
        rp({
            method: "GET",
            uri: zenhub.root + "/p1/repositories/" + repoId + "/reports/releases",
            json: true,
            headers: {
                "X-Authentication-Token": zenhub.token
            }
        }),
    findRelease: (releasesArr, releaseTitle) => {
        return releasesArr.filter(
            release => (release.title === releaseTitle)
        )[0]
    },
    getReleaseIssues: releaseId =>
        rp({
            method: "GET",
            uri: zenhub.root + "/p1/reports/release/" + releaseId + "/issues",
            json: true,
            headers: {
                "X-Authentication-Token": zenhub.token
            }
        }),
};

const github = {
    root: 'https://api.github.com',
    token: null,
    getIssue: (repoTitle, issueNumber) =>
        rp({
            method: "GET",
            uri: github.root + "/repos/performant-software/" + repoTitle + "/issues/" + issueNumber,
            json: true,
            headers: {
                "User-Agent": "generate-release-reports",
                "Authorization": "Bearer " + github.token
            }
        }),
    getComments: uri => {
        return rp({
            method: "GET",
            uri: uri,
            json: true,
            headers: {
                "User-Agent": "generate-release-reports",
                "Authorization": "Bearer " + github.token
            }
        })},
};

module.exports = {
    generate: config => {
        const releaseTitle = 'GNB Cloud Release 0.4.70';
        zenhub.token = config.ztoken;
        github.token = config.gtoken;

        return zenhub.getAllReleaseReports(zenhub.PrimaryRepoId)
            .then(
                releaseArr => zenhub.findRelease(releaseArr, releaseTitle)
            )
            .then(foundRelease =>
                zenhub.getReleaseIssues(foundRelease.release_id)
                    .then(issuesArr => {
                        return {
                            detail: foundRelease,
                            issues: issuesArr
                        }
                    })
            )
            .then(release => {

                  return  Promise.all(
                        release.issues.map(issue => {
                            let repoTitle = findRepoTitle(issue.repo_id);
                            let issueNumber = issue.issue_number.toString();
                            return github.getIssue(repoTitle, issueNumber)
                        }))
                        .then( issues => {
                                return {
                                    detail: release.detail,
                                    issues: issues
                                }
                            }
                        )

                }
            )
            .then(release => {
                return {
                    detail: release.detail,
                    issues: release.issues.map(issue => {
                                return  {
                                    url: issue.html_url,
                                    number: issue.number,
                                    title: issue.title,
                                    createdAt: moment(issue.created_at),
                                    commentsCount: issue.comments,
                                    commentsApiUrl: issue.comments_url,
                                    closedAt: moment(issue.closed_at),
                                    body: issue.body,
                                    state: issue.state,
                                    labels: issue.labels.map(label => label.name)
                                }
                            })
                }
            })
            .then(release => {
                const comments = Promise.all (
                    release.issues.map(
                        issue => {
                            return github.getComments(issue.commentsApiUrl);
                        }))
                return Promise.all([release.detail, release.issues, comments])
            })
            .then(([detail, issues, comments]) => {
                return {
                    detail: detail,
                    issues: issues.map((issue, index) => {
                        return {...issue, comments: comments[index]}
                    })
                }
            })
            .then(data => {console.log(data.issues[0].comments)})
            .catch(function (err) {
              console.log("ERROR!!");
              console.log(err)
              console.log("ERROR!!");
            });
    }
};


// module.exports = {
//   generate: (config) => {
//
//       const zhOptions = {
//           uri: 'https://api.zenhub.com/p1/reports/release/5e309e4032970b6af25e726c/issues',
//           headers: {
//               'X-Authentication-Token': config.ztoken
//           }
//       };
//
//       const ghOptions = {
//           uri: 'https://api.github.com/repos/performant-software/3DFleet/issues/',
//           headers: {
//               'User-Agent': 'generate-release-reports',
//           }
//       };
//
//       if (config.gtoken) {
//           ghOptions.headers['Authorization'] = generateGhAuthorization(config.gtoken);
//       }
//
//
//       rp(zhOptions)
//           .then(response => JSON.parse(response))
//           .then(json => json.map(issue => issue.issue_number))
//           .then(issuesNumberArr => {
//               const issueOptionsArr = issuesNumberArr.map((number, i) => {
//                   let ghOptionsCopy = {...ghOptions};
//                   ghOptionsCopy.uri = ghOptionsCopy.uri + issuesNumberArr[i];
//                   return ghOptionsCopy;
//               });
//               return issueOptionsArr;
//           })
//           .then(optionsArr => {
//               const issuesDataPromises = optionsArr.map(optionsObj => {
//
//                   return rp(optionsObj).then(data => {
//                      return JSON.parse(data)
//                   })
//
//               });
//               return Promise.all(issuesDataPromises)
//           })
//           .then(issuesArr => {
//
//               const runDate = moment();
//
//               const issues = issuesArr.map(issue => {
//                   return {
//                       url: issue.html_url,
//                       number: issue.number,
//                       title: issue.title,
//                       createdAt: moment(issue.created_at),
//                       comments: issue.comments,
//                       closedAt: moment(issue.closed_at),
//                       body: issue.body,
//                       state: issue.state,
//                       labels: issue.labels.map(label => label.name)
//                   }
//               });
//
//               const templatePath = path.join(__dirname, 'report.jade');
//               const template = jade.compileFile(templatePath);
//
//               const context = {
//                   issues: issues,
//                   runDate: runDate
//               };
//
//               const html = template(context);
//
//               const fileName = getReportName();
//
//               fs.writeFile(fileName, html, function (err) {
//                   if (err) {
//                       console.log(err);
//                   } else {
//                       console.log('Generated issue report %s', fileName);
//                   }
//               });
//
//           })
//
//           .catch(function (err) {
//           console.log("ERROR!!");
//           console.log(err)
//         });
//
//   }
// };

