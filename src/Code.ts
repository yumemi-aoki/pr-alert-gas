function main() {
  Logger.log('Hello World');
}

function doPost(e) {
  const data = JSON.parse(e.postData.getDataAsString());
  Logger.log(data);
}
