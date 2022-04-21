function injectScript(file_path, tag) {
  var node = document.getElementsByTagName(tag)[0];
  var script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", file_path);
  node.appendChild(script);
}
injectScript(chrome.runtime.getURL("test.js"), "body");
let mapData = null;
const handleFromWeb = async (event) => {
  if (event.data.from) {
    const data = event.data.data;
    console.log(`process from ${event.data.from}`);
    console.log(data);
    chrome.runtime.onMessage.addListener(function (
      request,
      sender,
      sendResponse
    ) {
      console.log(
        sender.tab
          ? "from a content script:" + sender.tab.url
          : "from the extension"
      );
      mapData = data;
    });
  }
};
window.addEventListener("message", handleFromWeb);

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  console.log("dari popup");
  response(mapData);
});
