const convToBlackWhite = (arr) => {
  const res = [];
  let i = 0;
  for (let i = 0; i < arr.length; i += 4) {
    const cur =
      (arr[i] * 0.2126 + arr[i + 1] * 0.7152 + arr[i + 2] * 0.0722) / 255;
    if (cur >= 0.5) {
      res.push(0);
    } else {
      res.push(1);
    }
  }
  return res;
};

let getMap = document.getElementById("getMap");
let getImage = document.getElementById("watermark");
let btnembed = document.getElementById("btnembed");

getMap.addEventListener("click", async () => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { greeting: "hello junho" },
      function (response) {
        if (response) {
          chrome.storage.sync.set({ map: JSON.parse(response.map) });
        }
      }
    );
  });
});

let file;

getImage.addEventListener("change", (e) => {
  file = e.target.files[0];
});

btnembed.addEventListener("click", (e) => {
  let reader = new FileReader();

  reader.readAsArrayBuffer(file);

  reader.onload = function () {
    inkjet.decode(reader.result, function (err, decoded) {
      // decoded: { width: number, height: number, data: Uint8Array }

      const key = document.getElementById("key").value;

      const watermarkArray = convToBlackWhite(decoded.data);
      console.log(watermarkArray);
      console.log(key);
    });
  };

  reader.onerror = function () {
    console.log(reader.error);
  };
});
