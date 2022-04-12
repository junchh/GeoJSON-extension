var hehe = document.createElement("div");
hehe.classList.add("leaflet-control-zoom");
hehe.classList.add("leaflet-bar");
hehe.classList.add("leaflet-control");
hehe.onClick = () => {
  console.log("yoo");
};

var link = document.createElement("a");
link.classList.add("leaflet-control-zoom-in");
link.href = "#";
link.title = "Huhuhu";
// link.onClick = () => {

// };

hehe.appendChild(link);
var parentDiv = document.getElementsByClassName("leaflet-top leaflet-right");
parentDiv[0].appendChild(hehe);
var code = document.getElementsByClassName("CodeMirror-code");

var codeClone = code[0].cloneNode(true);
var lineNumberDiv = codeClone.getElementsByClassName(
  "CodeMirror-linenumber CodeMirror-gutter-elt"
);
for (let i = 0; i < lineNumberDiv.length; i++) {
  lineNumberDiv[i].innerHTML = "";
}
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log(
    sender.tab
      ? "from a content script:" + sender.tab.url
      : "from the extension"
  );
  console.log(request.greeting);
  sendResponse({ map: codeClone.textContent });
});
