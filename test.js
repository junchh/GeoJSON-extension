window.postMessage({ from: "inject", data: window.api.data.get("map") });

window.api.on("change", (e) => {
  window.postMessage({ from: "inject", data: e.obj.map });
});
