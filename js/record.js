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
  const options = { mimeType: "video/webm;codecs=h264" };
  let recorder = new MediaRecorder(outputStream, options);
  let recordedBlobs = [];
  recorder.addEventListener("dataavailable", (e) => {
    recordedBlobs.push(e.data);
  });
  //録画終了時に動画ファイルのダウンロードリンクを生成する処理
  recorder.addEventListener("stop", () => {
    let blobUrl = null;
    const blob = new Blob(recordedBlobs, { type: "video/mp4" });
    blobUrl = window.URL.createObjectURL(blob);
    let movieName = Math.random().toString(36).slice(-8);
    anchor.download = "movie_" + movieName + ".webm";
    anchor.setAttribute("href", blobUrl);
    anchor.removeAttribute("disabled");
  });
  //録画開始
  M.toast({
    html: "動画を録画しています...",
    classes: "js-toast",
  });
  recorder.start();
  let clickEvent = document.createEvent("MouseEvents"); // イベントオブジェクトを作成
  clickEvent.initEvent("click", false, true); // イベントの内容を設定
  playSound.dispatchEvent(clickEvent); // イベントを発火させる
  recordMovie.setAttribute("disabled", "disabled");
  if (anchor.hasAttribute("disabled") === false) {
    anchor.setAttribute("disabled", "disabled");
  }
  audioBufferSrc.onended = () => {
    recorder.stop();
    M.toast({
      html: "動画の録画が完了しました",
      classes: "js-toast",
    });
    recordMovie.removeAttribute("disabled");
  };
});

// 離脱ガード
window.addEventListener("beforeunload", (e) => {
  e.preventDefault();
  e.returnValue = "作成した動画は保存されませんが、よろしいですか？";
});
