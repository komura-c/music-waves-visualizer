// ブラウザによって異なる関数名を定義
window.requestAnimationFrame = (() => {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function (callback, element) {
      window.setTimeout(callback, 1000 / 60);
    }
  );
})();
window.AudioContext = (() => {
  return (
    window.webkitAudioContext || window.AudioContext || window.mozAudioContext
  );
})();
// DOM要素を取得
const playSound = document.querySelector("a#playSound");
const recordMovie = document.querySelector("a#recordMovie");
const imageName = document.querySelector("div.js-imageName");
const audioName = document.querySelector("div.js-audioName");
//ダウンロード用のリンクを準備
const anchor = document.getElementById("downloadLink");
// camvasの要素を取得
const canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let rawWidth = 0;
let rawHeight = 0;
// AudioContextを作成
let audioCtx = new AudioContext();
// 動画出力用のAudioStreamNode
let streamDestination = audioCtx.createMediaStreamDestination();
// AudioBufferSourceNodeの変数を定義
let audioBufferSrc = null;
// 波形データを格納するバッファの変数を定義
let buffer = null;
// ImageContextを作成
let imageCtx = new Image();
let imageCtxWidth = 0;
let imageCtxHeight = 0;
let imageFile = null;
let imageData = null;
// audio
let audioFile = null;
let audioData = null;
// AnalyserNodeを作成
let analyser = audioCtx.createAnalyser();
analyser.fftSize = 2048;
let bufferLength = analyser.frequencyBinCount; // analyser.fftSizeの半分になる(1024)
let data = new Uint8Array(bufferLength);
let posX = 0;
let posY = 0;
// recoder
let recorder;
// mode
let mode = 0;
const modeElem = document.getElementById("mode");
const Setup = () => {
  let instance = M.FormSelect.init(modeElem, { classes: "js-mode" });
  mode = instance.getSelectedValues();
};
Setup();
modeElem.addEventListener("change", Setup);
