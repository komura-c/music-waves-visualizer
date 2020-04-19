// ブラウザによって異なる関数名を定義
window.requestAnimationFrame = (() => {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function (callback, element) {
      window.setTimeout(callback, 1000 / 60);
    };
})();
window.AudioContext = (() => {
  return window.webkitAudioContext || window.AudioContext || window.mozAudioContext;
})();

let preview = document.querySelector("div.preview");
let msg = document.querySelector("p#msg");

const msgFlash = () => {
  let msgBox = document.querySelector("div#msgBox");
  msgBox.style.display = 'block';
  setTimeout(() => { msgBox.classList.add('show'); }, 100);
  setTimeout(() => { msgBox.classList.remove('show'); }, 3000);
  setTimeout(() => { msgBox.style.display = 'none'; }, 3500);
};

// AudioContextを作成
let audioCtx = new AudioContext();

// 動画出力用のAudioStreamNode
let streamDestination = audioCtx.createMediaStreamDestination();

// AudioBufferSourceNodeの変数を定義
let audioBufferSrc = null;

// 波形データを格納するバッファの変数を定義
let buffer = null;

let playSound = document.querySelector("button#playSound");
let recordMovie = document.querySelector("button#recordMovie");

const LoadSample = (ctx, url) => {
  fetch(url).then(response => {
    return response.arrayBuffer();
  }).then(arrayBuffer => {
    ctx.decodeAudioData(arrayBuffer, (b) => { buffer = b; }, () => { });
    playSound.removeAttribute("disabled");
    recordMovie.removeAttribute("disabled");
  }).catch((error) => {
    msg.textContent = error;
    msgFlash();
  });
}

// camvasの要素を取得
let canvas = document.getElementById("graph")
let ctx = canvas.getContext("2d");
let imageCtx = new Image();
let rawWidth = 0;
let rawHeight = 0;
let imageCtxWidth = 0;
let imageCtxHeight = 0;

let imageLabel = document.querySelector("label#imageLabel");
let imageFile = null;
let imageData = null;

const imageLoad = () => {
  imageFile = document.querySelector("input#imageFile").files[0];
  imageLabel.textContent = imageFile.name;
  // readerのresultプロパティに、データURLとしてエンコードされたファイルデータを格納
  let reader = new FileReader();
  reader.onload = () => {
    imageData = reader.result
    msg.textContent = "画像を読み込みました";
    msgFlash();
    imageCtx.onload = () => {
      rawWidth = imageCtx.width;
      rawHeight = imageCtx.height;
      if (rawWidth > canvas.width || rawHeight > canvas.height) {
        imageCtxWidth = canvas.width;
        imageCtxHeight = Math.round(rawHeight * (canvas.width / rawWidth));
        do {
          imageCtxWidth -= 1;
          imageCtxHeight -= 1;
        } while (imageCtxHeight > canvas.height);
      } else {
        imageCtxWidth = imageCtx.width;
        imageCtxHeight = imageCtx.height;
      }
    }
    imageCtx.src = imageData;
  }
  reader.readAsDataURL(imageFile);
};

let audioLabel = document.querySelector("label#audioLabel");
let audioFile = null;
let audioData = null;

const audioLoad = () => {
  audioFile = document.querySelector("input#audioFile").files[0];
  audioLabel.textContent = audioFile.name;
  // readerのresultプロパティに、データURLとしてエンコードされたファイルデータを格納
  let reader = new FileReader();
  reader.onload = () => {
    audioData = reader.result
    LoadSample(audioCtx, audioData);
    msg.textContent = "音楽を読み込みました";
    msgFlash();
  }
  reader.readAsDataURL(audioFile);
};

let mode = 0;

// AnalyserNodeを作成
let analyser = audioCtx.createAnalyser();
analyser.fftSize = 2048;
let bufferLength = analyser.frequencyBinCount; // analyser.fftSizeの半分になる(1024)

let posX = 0;
let posY = 0;

// canvasに描画するグラフの関数
const DrawGraph = () => {
  ctx.fillStyle = "rgba(34, 34, 34, 1.0)";
  ctx.fillRect(0, 0, 1024, 512);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  if (imageData !== null) {
    let marginWidth = canvas.width - imageCtxWidth
    if (marginWidth !== 0) {
      posX = marginWidth / 2; // imageのwidthをcenterにする
    }
    let marginHeight = canvas.height - imageCtxHeight
    if (marginHeight !== 0) {
      posY = marginHeight / 2; // imageのheightをcenterにする
    }
    ctx.drawImage(imageCtx, 0, 0, rawWidth, rawHeight, posX, posY, imageCtxWidth, imageCtxHeight);
  }
  let data = new Uint8Array(bufferLength);
  if (mode != 1) analyser.getByteFrequencyData(data); //Spectrum Data

  else analyser.getByteTimeDomainData(data); //Waveform Data
  if (mode == 1) ctx.beginPath();
  for (let i = 0; i < bufferLength; ++i) {
    if (mode == 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillRect(i, 512 - data[i] * 1.25, 1, data[i] * 1.25);
    }
    if (mode == 1) {
      ctx.lineTo(i, 384 - data[i] * 1);
    }
    if (mode == 2) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      if (i <= 465) {
        ctx.fillRect(i * 2.5, 512 - data[i] * 1.25, 1 * 2.5, data[i] * 1.25); //10khz帯
      }
    }
  }
  if (mode == 1) {
    ctx.stroke();
  }
  requestAnimationFrame(DrawGraph);
}
let timerId = requestAnimationFrame(DrawGraph);

const Setup = () => {
  mode = document.getElementById("mode").selectedIndex;
  analyser.smoothingTimeConstant = parseFloat(document.getElementById("smoothing").value);
}
Setup();

playSound.addEventListener("click", (event) => {
  let label;
  if (event.target.textContent == "ストップ") {
    audioBufferSrc.stop(0);
    cancelAnimationFrame(timerId);
    label = "スタート";
  } else {
    audioBufferSrc = audioCtx.createBufferSource();
    audioBufferSrc.buffer = buffer;
    audioBufferSrc.loop = false;
    audioBufferSrc.connect(analyser);
    audioBufferSrc.connect(audioCtx.destination);
    audioBufferSrc.connect(streamDestination);
    audioBufferSrc.start(0);
    label = "ストップ";
    scrollBottom();
  }
  event.target.textContent = label;
});

document.querySelector("select#mode").addEventListener("change", Setup);
document.querySelector("select#smoothing").addEventListener("change", Setup);

let recorder;

recordMovie.addEventListener("click", () => {
  let canvasStream = canvas.captureStream();
  let audioStream = streamDestination.stream;
  let outputStream = new MediaStream();
  [audioStream, canvasStream].forEach((stream) => {
    stream.getTracks().forEach(function (track) {
      outputStream.addTrack(track);
    });
  });
  //ストリームからMediaRecorderを生成
  let recorder = new MediaRecorder(outputStream);
  let chunks = [];
  recorder.addEventListener('dataavailable', (e) => {
    chunks.push(e.data);
  });
  //ダウンロード用のリンクを準備
  let anchor = document.getElementById('downloadLink');
  //録画終了時に動画ファイルのダウンロードリンクを生成する処理
  recorder.addEventListener('stop', () => {
    let blobUrl = null;
    const blob = new Blob(chunks, { type: 'video/webm' });
    blobUrl = window.URL.createObjectURL(blob);
    let movieName = Math.random().toString(36).slice(-8)
    anchor.download = 'movie_' + movieName + '.webm';
    anchor.setAttribute("href", blobUrl);
    anchor.removeAttribute("disabled");
  });
  //録画開始
  msg.textContent = "動画を書き出しています...";
  msgFlash();
  recorder.start();
  let event = document.createEvent("MouseEvents"); // イベントオブジェクトを作成
  event.initEvent("click", false, true); // イベントの内容を設定
  playSound.dispatchEvent(event); // イベントを発火させる
  recordMovie.setAttribute("disabled", "disabled");
  preview.style.display = 'none';
  if (anchor.hasAttribute("disabled") === false) {
    anchor.setAttribute("disabled", "disabled");
  }
  audioBufferSrc.onended = () => {
    recorder.stop();
    msg.textContent = "動画の書き出しが完了しました";
    msgFlash();
    preview.style.display = 'block';
    recordMovie.removeAttribute("disabled");
  };
});

/* スムーズスクロールアニメーション */
let scrollBottom = () => {
  let top = getElementAbsoluteTop("screen");
  scrollScreen(top, 20);
  return false;
}

function getElementAbsoluteTop(id) {
  let target = document.getElementById(id);
  let rect = target.getBoundingClientRect();
  return rect.top;
}

function scrollScreen(desty, time) {
  let top = Math.floor(document.documentElement.scrollTop || document.body.scrollTop);
  let tick = desty / time;
  let newy = top + tick;
  document.documentElement.scrollTop = newy;
  setTimeout(function () { scrollScreenInt(top, desty, newy, tick); }, 20);
}

function scrollScreenInt(starty, desty, newy, tick) {
  let stop = true;
  newy = newy + tick;
  if (desty < 0) {
    if (starty + desty < newy) {
      stop = false;
    } else {
      newy = starty + desty;
    }
  } else {
    if (newy < starty + desty) {
      stop = false;
    } else {
      newy = starty + desty;
    }
  }

  document.documentElement.scrollTop = newy;
  if (stop == false) {
    setTimeout(function () { scrollScreenInt(starty, desty, newy, tick); }, 20);
  }
}
