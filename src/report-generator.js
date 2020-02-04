const fs = require('fs');
const moment = require('moment');
const rp = require('request-promise');

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
    releaseTitle: null,
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
        })
    },
    cleanComments: commentsArr => {
        if (commentsArr.length < 1) {
            return;
        } else {
            return commentsArr.map(comment => {
                return {
                    ...comment,
                    body: comment.body.replace(/!\[.*\]\(.*\)/g, " ")
                }
            })
        }
    }
};

module.exports = {
    generate: config => {
        zenhub.releaseTitle = config.rel;
        zenhub.token = config.ztoken;
        github.token = config.gtoken;

        return zenhub.getAllReleaseReports(zenhub.PrimaryRepoId)
            .then(
                releaseArr => zenhub.findRelease(releaseArr, zenhub.releaseTitle)
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
                            return github.getComments(issue.commentsApiUrl)
                        }));
                return Promise.all([release.detail, release.issues, comments])
            })
            .then(([detail, issues, comments]) => {
                const cleanedComments = comments.map(github.cleanComments)

                return {
                    detail: detail,
                    issues: issues.map((issue, index) => {
                        return {...issue, comments: cleanedComments[index]}
                    })
                }
            })
            .then(release => {
                const fileName = "reports/" + release.detail.title + ".json";
                const json = JSON.stringify(release, null, 4);

                fs.writeFile(fileName, json, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Generated release report: ', fileName);
                    }
                });
            })
            .catch(function (err) {
              console.log("ERROR!!");
              console.log(err)
              console.log("ERROR!!");
            });
    }
};