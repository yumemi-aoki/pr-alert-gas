function main() {}

/**
 * @param req HttpRequest
 */
function doPost(req) {
  const data = JSON.parse(req.postData.getDataAsString());

  if (data.pull_request) {
    if (data.action === 'opened' || data.action === 'reopened' || data.action === 'ready_for_review') {
      sendRequestReviewMessage(data.pull_request);
    }
    /* ここのコメントアウトを解除するとPR人数と同じ回数分だけSlack通知してしまうので注意！

    if (data.action === 'assigned' || data.action === 'review_requested') {
      const created = new Date(data.pull_request.created_at);
      const updated = new Date(data.pull_request.updated_at);

      if (created.getTime() < updated.getTime()) sendRequestReviewMessage(data.pull_request);
    }
    */
    if (data.action === 'closed' || data.action === 'merged') {
      sendCloseMessage(data.pull_request);
    }
  }
}

function sendRequestReviewMessage(pr) {
  if (!pr.requested_reviewers) return;

  const reviewers = pr.requested_reviewers.map(person => {
    return person.login;
  });

  if (reviewers.length <= 0) return;

  const members = getMemberData();
  let message = '';
  reviewers.forEach(name => {
    if (members[name]) message = `${message} <@${members[name]}>`;
  });

  message = `プルリク見てね！${message}`;

  slackPost(message, [{
    color: '#36a64f',
    author_name: pr.user.login,
    author_link: pr.user.html_url,
    title: pr.title,
    title_link: pr.html_url,
    text: `想定所要時間: ${(pr.additions/2/60).toFixed(1)}分`,
    footer: pr.html_url
  }]);
}

function sendCloseMessage(pr) {
  slackPost(`<!here> 🎉 プルリク見てくれてありがとう！`, [{
    author_name: pr.user.login,
    author_link: pr.user.html_url,
    title: pr.title,
    title_link: pr.html_url,
    footer: pr.html_url
  }]);
}

function slackPost(message, attachments=null) {
  const appConfig = PropertiesService.getScriptProperties();
  const postUrl = appConfig.getProperty("SLACK_WEBHOOK_URL");

  const send:{[key:string]:any} = {
    text: message
  };

  if (attachments) send.attachments = attachments;

  const options:GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(send)
  };

  UrlFetchApp.fetch(postUrl, options);
}

// メンバーのSlackIDとGithubリストを取得
function getMemberData() {
  const appConfig = PropertiesService.getScriptProperties();
  const sheetId = appConfig.getProperty('SHEET_ID');
  const memberSheetName = appConfig.getProperty('SHEET_NAME_MEMBERS');
  const memberSheet = SpreadsheetApp.openById(sheetId).getSheetByName(memberSheetName);
  const members = memberSheet.getDataRange().getValues();

  const dataTemplate = {
    slack: { cell: 'SlackID', row: -1 },
    github: { cell: 'GithubID', row: -1 }
  };
  members.shift().forEach(function(cell, index) {
    Object.keys(dataTemplate).some(function(key) {
      if (cell === dataTemplate[key].cell) {
        dataTemplate[key].row = index;
      }
    });
  });

  const membersData:{ [key:string]: any } = {};

  members.forEach(function (col) {
    const github = col[dataTemplate.github.row];
    const slack = col[dataTemplate.slack.row];

    membersData[github] = slack;
  });

  return membersData;
}
