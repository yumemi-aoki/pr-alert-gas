function main() {}

/**
 * @param req HttpRequest
 */
function doPost(req) {
  const data = JSON.parse(req.postData.getDataAsString());
  if (data.pull_request) {
    slackPost("テストメッセージ", [{
      color: '#36a64f',
      author_name: data.pull_request.user.login,
      author_link: data.pull_request.user.url,
      title: data.pull_request.title,
      title_link: data.pull_request.url,
      footer: data.pull_request.url
    }]);
  }
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
