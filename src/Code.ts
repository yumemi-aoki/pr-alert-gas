function main() {}

/**
 * @param req HttpRequest
 */
function doPost(req) {
  const data = JSON.parse(req.postData.getDataAsString());

  if (data.pull_request) {
    if (data.action === 'opened' || data.action === 'reopened' || data.action === 'ready_for_review') {
      getLockAndSleep(5,20);
      sendRequestReviewMessage(data.pull_request);
    }
    if (data.action === 'assigned' || data.action === 'review_requested') {
      if(getLockAndSleep(5,20)) sendRequestReviewMessage(data.pull_request);
    }
    if (data.action === 'closed' || data.action === 'merged') {
      sendCloseMessage(data.pull_request);
    }
  }
}

function sendRequestReviewMessage(pr:{[key:string]:any}) {
  if (pr.requested_reviewers) pr.requested_reviewers = [];
  const reviewers:Array<string> = pr.requested_reviewers.map((r:{[key:string]:any}) => {
    return r.login;
  });

  let message = '';
  if (reviewers.length > 0) {
    const members = getMemberData();
    reviewers.forEach(name => {
      if (members[name]) message = `<@${members[name]}> ${message}`;
    });
  } else {
    message = '<!here>'
  }

  message = `${message}プルリク見てね！`;

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

// 同時に複数の処理が走らないようにロックする
function getLockAndSleep(wait:number, lockTime:number) {
  const lock = LockService.getScriptLock();
  if(lock.tryLock(wait)) {
    Utilities.sleep(lockTime);
    return true;
  }
  return false;
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
