function main() {}

/**
 * @param req HttpRequest
 */
function doPost(req) {
  const data = JSON.parse(req.postData.getDataAsString());
  if (data.pull_request) {
    slackPost(data.pull_request.url);
  }
}

function slackPost(message) {
  const appConfig = PropertiesService.getScriptProperties();
  const postUrl = appConfig.getProperty("SLACK_WEBHOOK_URL");
  const send = {
    username: "test",
    icon_emoji: ":gueee:",
    text: "test message" + message
  };
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(send)
  };

  UrlFetchApp.fetch(postUrl, options);
}
