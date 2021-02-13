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
  recorder.addEventListener("stop", async() => {
    let blobUrl = null;
    const blob = new Blob(recordedBlobs, { type: "video/mp4" });
    const movieName = Math.random().toString(36).slice(-8);
    const outputName = "movie_" + movieName + ".mp4";

    const video = await generateMp4Video(blob, movieName, outputName)
    blobUrl = createVideoObjectURL([video], { type: 'video/mp4' });

    anchor.download = outputName;
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

async function generateMp4Video(blob, movieName, outputName) {
  const { createFFmpeg, fetchFile } = FFmpeg
  const ffmpeg = createFFmpeg({ log: true })
  await ffmpeg.load()
  await ffmpeg.FS('writeFile', movieName, await fetchFile(blob));
  await ffmpeg.run('-i', movieName,  '-c', 'copy', outputName);
  const data = ffmpeg.FS('readFile', outputName)
  return data
}

function createVideoObjectURL(array, options) {
  const blob = new Blob(array, options)
  const objectUrl = URL.createObjectURL(blob)
  return objectUrl
}

// 離脱ガード
window.addEventListener("beforeunload", (e) => {
  e.preventDefault();
  e.returnValue = "作成した動画は保存されませんが、よろしいですか？";
});
