let color = "#3aa757";
let map = {};
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ map });
  console.log(map);
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    );
    console.log(newValue.type);
  }
});
