const pi = math.pi;
function dec2bin(dec) {
  const buffer = new ArrayBuffer(8);
  new DataView(buffer).setFloat64(0, dec, false);
  const newBuf = new Uint8Array(buffer);

  const res = [];
  for (let i = 0; i < 8; i++) {
    for (let j = 7; j >= 0; j--) {
      if (newBuf[i] & (1 << j)) {
        res.push(1);
      } else {
        res.push(0);
      }
    }
  }
  return res;
}

function bin2dec(bin) {
  const arr = [];
  for (let i = 0; i < 64; i += 8) {
    let k = 7;
    let num = 0;
    for (let j = i; j < i + 8; j++) {
      if (bin[j] === 1) {
        num += 1 << k;
      }
      k--;
    }
    arr.push(num);
  }
  const buffer = new ArrayBuffer(8);
  new Uint8Array(buffer).set(arr);
  return new DataView(buffer).getFloat64(0, false);
}
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

const parseMap = (data) => {
  const result = [];
  const features = data.features;
  let ptr = 0;
  const forbidden = new Map();
  for (let i = 0; i < features.length; i++) {
    const geometry = features[i].geometry;

    if (geometry.type === "Point") {
      result.push(
        math.complex(geometry.coordinates[0], geometry.coordinates[1])
      );
      ptr++;
    } else if (geometry.type === "LineString") {
      for (let j = 0; j < geometry.coordinates.length; j++) {
        result.push(
          math.complex(geometry.coordinates[j][0], geometry.coordinates[j][1])
        );
        ptr++;
      }
    } else if (geometry.type === "Polygon") {
      for (let j = 0; j < geometry.coordinates.length; j++) {
        for (let k = 0; k < geometry.coordinates[j].length; k++) {
          if (k === 0 || k === geometry.coordinates[j].length - 1) {
            forbidden.set(ptr, 1);
          }
          result.push(
            math.complex(
              geometry.coordinates[j][k][0],
              geometry.coordinates[j][k][1]
            )
          );
          ptr++;
        }
      }
    } else if (geometry.type === "MultiPoint") {
      for (let j = 0; j < geometry.coordinates.length; j++) {
        result.push(
          math.complex(geometry.coordinates[j][0], geometry.coordinates[j][1])
        );
        ptr++;
      }
    } else if (geometry.type === "MultiLineString") {
      for (let j = 0; j < geometry.coordinates.length; j++) {
        for (let k = 0; k < geometry.coordinates[j].length; k++) {
          result.push(
            math.complex(
              geometry.coordinates[j][k][0],
              geometry.coordinates[j][k][1]
            )
          );
          ptr++;
        }
      }
    } else if (geometry.type === "MultiPolygon") {
      for (let j = 0; j < geometry.coordinates.length; j++) {
        for (let k = 0; k < geometry.coordinates[j].length; k++) {
          for (let l = 0; l < geometry.coordinates[j][k].length; l++) {
            if (l === 0 || l === geometry.coordinates[j][k].length - 1) {
              forbidden.set(ptr, 1);
            }
            result.push(
              math.complex(
                geometry.coordinates[j][k][l][0],
                geometry.coordinates[j][k][l][1]
              )
            );
            ptr++;
          }
        }
      }
    }
  }
  return [result, forbidden];
};

const parseComplex = (data, originalMap) => {
  const features = originalMap.features;
  let ptr = 0;
  for (let i = 0; i < features.length; i++) {
    const geometry = features[i].geometry;

    if (geometry.type === "Point") {
      geometry.coordinates[0] = data[ptr].re;
      geometry.coordinates[1] = data[ptr].im;
      ptr++;
    } else if (geometry.type === "LineString") {
      for (let j = 0; j < geometry.coordinates.length; j++) {
        geometry.coordinates[j][0] = data[ptr].re;
        geometry.coordinates[j][1] = data[ptr].im;
        ptr++;
      }
    } else if (geometry.type === "Polygon") {
      for (let j = 0; j < geometry.coordinates.length; j++) {
        for (let k = 0; k < geometry.coordinates[j].length; k++) {
          geometry.coordinates[j][k][0] = data[ptr].re;
          geometry.coordinates[j][k][1] = data[ptr].im;
          ptr++;
        }
      }
    } else if (geometry.type === "MultiPoint") {
      for (let j = 0; j < geometry.coordinates.length; j++) {
        geometry.coordinates[j][0] = data[ptr].re;
        geometry.coordinates[j][1] = data[ptr].im;
        ptr++;
      }
    } else if (geometry.type === "MultiLineString") {
      for (let j = 0; j < geometry.coordinates.length; j++) {
        for (let k = 0; k < geometry.coordinates[j].length; k++) {
          geometry.coordinates[j][k][0] = data[ptr].re;
          geometry.coordinates[j][k][1] = data[ptr].im;
          ptr++;
        }
      }
    } else if (geometry.type === "MultiPolygon") {
      for (let j = 0; j < geometry.coordinates.length; j++) {
        for (let k = 0; k < geometry.coordinates[j].length; k++) {
          for (let l = 0; l < geometry.coordinates[j][k].length; l++) {
            geometry.coordinates[j][k][l][0] = data[ptr].re;
            geometry.coordinates[j][k][l][1] = data[ptr].im;
            ptr++;
          }
        }
      }
    }
  }
  const excess = [];
  for (let i = ptr; i < data.length; i++) {
    excess.push([data[i].re, data[i].im]);
  }
  features.push({
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: excess,
    },
    properties: {},
  });
};

const fft = (a, invert) => {
  const fact = invert === 1 ? -1 : 1;
  const n = a.length;
  if (n === 1) return;

  const a0 = Array(Math.floor(n / 2));
  const a1 = Array(Math.floor(n / 2));
  for (let i = 0; i < Math.floor(n / 2); i++) {
    a0[i] = 0;
    a1[i] = 0;
  }
  for (let i = 0; 2 * i < n; i++) {
    a0[i] = a[2 * i];
    a1[i] = a[2 * i + 1];
  }

  fft(a0, invert);
  fft(a1, invert);

  for (let i = 0; 2 * i < n; i++) {
    const multiplier = math.complex({ r: 1, phi: (fact * 2 * pi * i) / n });
    a[i] = math.add(a0[i], math.multiply(multiplier, a1[i]));
    a[i + Math.floor(n / 2)] = math.subtract(
      a0[i],
      math.multiply(multiplier, a1[i])
    );
    if (invert === -1) {
      a[i] = math.divide(a[i], 2);
      a[i + Math.floor(n / 2)] = math.divide(a[i + Math.floor(n / 2)], 2);
    }
  }
};

const normalize = (phase) => {
  let phaseValue = phase % (2 * math.pi);
  if (phaseValue < 0) {
    phaseValue = (phaseValue + 2 * math.pi) % (2 * math.pi);
  }
  return phaseValue;
};

const getCategory = (phase, step) => {
  const region = Math.floor(phase / step);
  if (region % 2 === 0) {
    return 1;
  } else {
    return 0;
  }
};

const embed_fft = (map, watermark, step, key, width, height, forbidden) => {
  const stepNormalized = (step / 360.0) * 2 * math.pi;
  const newKey =
    key +
    "-" +
    width.toString() +
    "-" +
    height.toString() +
    "-" +
    map.length.toString();
  let mapData = map;
  const initialMapSize = mapData.length;
  const myrng = new Math.seedrandom(key);
  const order = [];
  const mp = new Map();
  for (let i = 0; i < watermark.length; ) {
    const g = (myrng.int32() >>> 0) % mapData.length;
    if (!mp.has(g) && !forbidden.has(g)) {
      order.push(g);
      i++;
      mp.set(g, 1);
    }
  }
  order.sort((a, b) => a - b);
  let newMap = [];
  for (let i = 0; i < watermark.length; i++) {
    newMap.push(mapData[order[i]]);
  }

  let cur = 1;
  while (watermark.length > cur) {
    cur *= 2;
  }
  let diff = cur - watermark.length;
  for (let i = 0; i < diff; i++) {
    newMap.push(math.complex(0));
  }
  fft(newMap, 1);

  //mapData = dft_normal(mapData);
  for (let i = 0; i < watermark.length; i++) {
    const polarForm = newMap[i].toPolar();
    const phi = normalize(polarForm.phi);
    if (getCategory(phi, stepNormalized) !== watermark[i]) {
      const newAngle = phi + stepNormalized;
      const r = polarForm.r;
      newMap[i] = math.complex({ r: r, phi: newAngle });
    }
    // if (i < 10) {
    //   console.log(mapData[i]);
    //   console.log(getCategory(mapData[i].toPolar().phi, stepNormalized));
    // }
  }
  fft(newMap, -1);
  for (let i = 0; i < watermark.length; i++) {
    mapData[order[i]] = newMap[i];
  }
  for (let i = watermark.length; i < newMap.length; i++) {
    mapData.push(newMap[i]);
  }
  let k = 0;
  for (let i = 0; i < mapData.length; i++) {
    if (order[k] === i || i >= initialMapSize) {
      const arr = dec2bin(mapData[i].re);
      if (arr[63] === 0) {
        arr[63] = 1;
      }
      mapData[i].re = bin2dec(arr);
      k++;
    } else {
      const arr = dec2bin(mapData[i].re);
      if (arr[63] === 1) {
        arr[63] = 0;
      }
      mapData[i].re = bin2dec(arr);
    }
  }
  return newKey;
  //mapData = inverse_dft_normal(mapData);
  // fft(mapData, 1);
  // console.log("batas");
  // // fft(mapData, -1);
};

const extract_fft_new = (map, step, keyString, forbidden) => {
  const myKey = keyString.split("-");
  const key = myKey[0];
  const width = parseInt(myKey[1]);
  const height = parseInt(myKey[2]);
  const mapSize = parseInt(myKey[3]);
  const result = [];
  const stepNormalized = (step / 360.0) * 2 * math.pi;
  const myrng = new Math.seedrandom(key);
  const order = [];
  const mp = new Map();
  let cur = 1;
  while (width * height > cur) {
    cur *= 2;
  }
  let diff = cur - width * height;
  if (diff + mapSize === map.length) {
    for (let i = 0; i < width * height; ) {
      const g = (myrng.int32() >>> 0) % (map.length - diff);
      if (!mp.has(g) && !forbidden.has(g)) {
        order.push(g);
        i++;
        mp.set(g, 1);
      }
    }
    order.sort((a, b) => a - b);
    let mapData = map;
    let newMap = [];
    for (let i = 0; i < width * height; i++) {
      newMap.push(mapData[order[i]]);
    }
    for (let i = 0; i < diff; i++) {
      newMap.push(mapData[mapData.length - diff + i]);
    }
    //mapData = dft_normal(mapData);
    fft(newMap, 1);

    for (let i = 0; i < width * height; i++) {
      const polarForm = newMap[i].toPolar();
      const phi = normalize(polarForm.phi);
      result.push(getCategory(phi, stepNormalized));
    }
    return result;
  } else {
    let mapData = map;
    let newMap = [];
    for (let i = 0; i < mapData.length; i++) {
      const arr = dec2bin(mapData[i].re);
      if (arr[63] === 1) {
        newMap.push(mapData[i]);
      }
    }
    console.log(newMap.length);
    fft(newMap, 1);

    for (let i = 0; i < width * height; i++) {
      const polarForm = newMap[i].toPolar();
      const phi = normalize(polarForm.phi);
      result.push(getCategory(phi, stepNormalized));
    }
    return result;
  }
};

const saveToImage = (filename, arr, width, height) => {
  const frameData = new Array(width * height * 4);
  let i = 0;
  let k = 0;

  while (i < frameData.length) {
    if (arr[k] === 1) {
      frameData[i++] = 0;
      frameData[i++] = 0;
      frameData[i++] = 0;
      frameData[i++] = 0xff;
    } else {
      frameData[i++] = 255;
      frameData[i++] = 255;
      frameData[i++] = 255;
      frameData[i++] = 0xff;
    }
    k++;
  }

  const buf = frameData;
  const options = {
    width: width,
    height: height,
    quality: 80,
  };

  inkjet.encode(buf, options, (err, encoded) => {
    const imageURL = URL.createObjectURL(new Blob([encoded.data]));

    const link = document.createElement("a");
    link.href = imageURL;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
};

let getMap = document.getElementById("getMap");
let getImage = document.getElementById("watermark");
let btnembed = document.getElementById("btnembed");
let generatedkey = document.getElementById("generatedkey");
let btnextract = document.getElementById("btnextract");

let file = null;
let map = null;

getImage.addEventListener("change", (e) => {
  file = e.target.files[0];
});

getMap.addEventListener("click", () => {
  console.log("the click");
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { greeting: "hello junho" },
      function (response) {
        if (response) {
          console.log("dari content script");
          console.log(response);
          map = response;
        }
      }
    );
  });
});

btnembed.addEventListener("click", (e) => {
  let reader = new FileReader();

  reader.readAsArrayBuffer(file);

  reader.onload = function () {
    inkjet.decode(reader.result, function (err, decoded) {
      const mp = map;
      const key = document.getElementById("key").value;
      const watermarkArray = convToBlackWhite(decoded.data);
      const [mapData, forbidden] = parseMap(mp);
      const he = math.complex(3, 4);
      const newKey = embed_fft(
        mapData,
        watermarkArray,
        0.03,
        key,
        decoded.width,
        decoded.height,
        forbidden
      );
      parseComplex(mapData, mp);
      const dataStr =
        "data:application/json," + encodeURIComponent(JSON.stringify(mp));
      chrome.tabs.create({
        url: "https://geojson.io/#data=" + dataStr,
        active: false,
      });

      generatedkey.innerHTML = "generated key: " + newKey;
    });
  };

  reader.onerror = function () {
    console.log(reader.error);
  };
});

btnextract.addEventListener("click", (e) => {
  if (map === null) {
    return;
  }
  const key = document.getElementById("key2").value;
  const mp = map;
  const [mapData, forbidden] = parseMap(mp);

  const watermarkData = extract_fft_new(mapData, 0.03, key, forbidden);

  const myArr = key.split("-");

  saveToImage("extracted.jpg", watermarkData, myArr[1], myArr[2]);
});
