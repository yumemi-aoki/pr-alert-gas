function main() {}

/**
 * @param req HttpRequest
 */
function doPost(req) {
  const data = JSON.parse(req.postData.getDataAsString());
  if (data.pull_request) {
    if (data.action === 'opened' || data.action === 'reopened' || data.action === 'assigned' || data.action === 'ready_for_review' || data.action === 'review_requested') {
      sendRequestReviewMessage(data.pull_request);
    }
    if (data.action === 'closed' || data.action === 'merged') {
      sendCloseMessage(data.pull_request);
    }
  }
}

function sendRequestReviewMessage(prData) {
  if (!prData.requested_reviewers) return;

  const reviewers = prData.requested_reviewers.map(person => {
    return person.login;
  });

  if (reviewers.length <= 0) return;

  const members = getMemberData();
  let message = '';
  reviewers.forEach(name => {
    if (members.name) message = `@${members.name} ${message}`;
  });

  message = `プルリク見てね！ ${message}`;

  slackPost(message, [{
    color: '#36a64f',
    author_name: prData.user.login,
    author_link: prData.user.url,
    title: prData.title,
    title_link: prData.url,
    footer: prData.url
  }]);
}

function sendCloseMessage(prData) {
  slackPost(`@here プルリク見てくれてありがとう！`, [{
    author_name: prData.user.login,
    author_link: prData.user.url,
    title: prData.title,
    title_link: prData.url,
    footer: prData.url
  }]);
}

function slackPost(message, attachments=null) {
  const appConfig = PropertiesService.getScriptProperties();
  const postUrl = appConfig.getProperty("SLACK_WEBHOOK_URL");

  const send:{[key:string]:any} = {
    username: "test",
    icon_emoji: ":gueee:",
    text: message,
    attachments: attachments
  };

  if (!attachments) delete send.attachments;

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(send)
  };

  UrlFetchApp.fetch(postUrl, options);
}

// メンバーのSlackIDとGithubリストを取得
function getMemberData() {
  var appConfig = PropertiesService.getScriptProperties();
  var sheetId = appConfig.getProperty('SHEET_ID');
  var memberSheetName = appConfig.getProperty('SHEET_NAME_MEMBERS');
  var memberSheet = SpreadsheetApp.openById(sheetId).getSheetByName(memberSheetName);
  var members = memberSheet.getDataRange().getValues();

  var dataTemplate = {
    slack: { cell: 'SlackID', row: -1 },
    github: { cell: 'GithubID', row: -1 }
  };
  members[0].forEach(function(cell, index) {
    Object.keys(dataTemplate).some(function(key) {
      if (cell === dataTemplate[key].cell) {
        dataTemplate[key].row = index;
      }
    });
  });

  var membersData:{ [key:string]: any } = {};

  members.forEach(function (col) {
    const github = col[dataTemplate.github.row];
    const slack = col[dataTemplate.slack.row];

    membersData.github = slack;
  });

  return membersData;
}
