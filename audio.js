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

let preview = document.querySelector("p#preview");
let msg = document.querySelector("p#msg");

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
  }).catch((error) => { msg.innerHTML = error });
}

let imageLabel = document.querySelector("label#imageLabel");
let imageFile = null;
let imageData = null;

const imageLoad = () => {
  imageFile = document.querySelector("input#imageFile").files[0];
  imageLabel.innerHTML = imageFile.name;
  // readerのresultプロパティに、データURLとしてエンコードされたファイルデータを格納
  let reader = new FileReader();
  reader.readAsDataURL(imageFile);
  reader.onload = () => {
    imageData = reader.result
    msg.innerHTML = "画像を読み込みました";
  }
};

let audioLabel = document.querySelector("label#audioLabel");
let audioFile = null;
let audioData = null;

const audioLoad = () => {
  audioFile = document.querySelector("input#audioFile").files[0];
  audioLabel.innerHTML = audioFile.name;
  // readerのresultプロパティに、データURLとしてエンコードされたファイルデータを格納
  let reader = new FileReader();
  reader.readAsDataURL(audioFile);
  reader.onload = () => {
    audioData = reader.result
    LoadSample(audioCtx, audioData);
    msg.innerHTML = "音楽を読み込みました";
  }
};

let mode = 0;
let timerId;

// AnalyserNodeを作成
let analyser = audioCtx.createAnalyser();
analyser.fftSize = 2048;
let bufferLength = analyser.frequencyBinCount; // analyser.fftSizeの半分になる(1024)

// camvasの要素を取得
let canvas = document.getElementById("graph")
let ctx = canvas.getContext("2d");

// canvasに描画するグラフの関数
const DrawGraph = () => {
  ctx.fillStyle = "rgba(34, 34, 34, 1.0)";
  ctx.fillRect(0, 0, 1024, 512);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  if (imageData != null) {
    let imageCtx = new Image();
    imageCtx.src = imageData;
    let posX = (canvas.width - imageCtx.width) / 2; // imageのwidthをcenterにする
    let posY = (canvas.height - imageCtx.height) / 2; // imageをcenterにする
    ctx.drawImage(imageCtx, posX, posY);
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
timerId = requestAnimationFrame(DrawGraph);

const Setup = () => {
  mode = document.getElementById("mode").selectedIndex;
  analyser.smoothingTimeConstant = parseFloat(document.getElementById("smoothing").value);
}
Setup();

playSound.addEventListener("click", (event) => {
  let label;
  if (event.target.innerHTML == "ストップ") {
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
  }
  event.target.innerHTML = label;
});

document.querySelector("select#mode").addEventListener("change", Setup);
document.querySelector("input#smoothing").addEventListener("change", Setup);

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
    const blob = new Blob(chunks, { type: 'video/webm' });
    blobUrl = window.URL.createObjectURL(blob);
    let movieName = Math.random().toString(36).slice(-8)
    anchor.download = 'movie_' + movieName + '.webm';
    anchor.href = blobUrl;
    anchor.style.display = 'block';
  });
  //録画開始
  msg.innerHTML = "動画を書き出しています...";
  recorder.start();
  let event = document.createEvent("MouseEvents"); // イベントオブジェクトを作成
  event.initEvent("click", false, true); // イベントの内容を設定
  playSound.dispatchEvent(event); // イベントを発火させる
  recordMovie.setAttribute("disabled", "disabled");
  preview.style.display = 'none';
  audioBufferSrc.onended = () => {
    recorder.stop();
    msg.innerHTML = "動画の書き出しが完了しました";
    preview.style.display = 'block';
    recordMovie.removeAttribute("disabled");
  };
});
