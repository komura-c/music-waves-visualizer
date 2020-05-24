// canvasに描画する関数
const drawBars = () => {
  ctx.fillStyle = "rgba(34, 34, 34, 1.0)";
  ctx.fillRect(0, 0, 1024, 512);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  if (imageData != null) {
    let marginWidth = canvas.width - imageCtxWidth;
    if (marginWidth != 0) {
      posX = marginWidth / 2; // imageのwidthをcenterにする
    }
    let marginHeight = canvas.height - imageCtxHeight;
    if (marginHeight != 0) {
      posY = marginHeight / 2; // imageのheightをcenterにする
    }
    ctx.drawImage(
      imageCtx,
      0,
      0,
      rawWidth,
      rawHeight,
      posX,
      posY,
      imageCtxWidth,
      imageCtxHeight
    );
  }

  if (mode != 1) analyser.getByteFrequencyData(data);
  //Spectrum Data
  else {
    analyser.getByteTimeDomainData(data); //Waveform Data
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.beginPath();
    ctx.stroke();
  }
  for (let i = 0; i < bufferLength; ++i) {
    if (mode == 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      if (i <= 465) {
        ctx.fillRect(i * 2.5, 512 - data[i] * 1.25, 1 * 2.5, data[i] * 1.25); //10khz帯
      }
    }
    if (mode == 1) {
      ctx.lineTo(i, 384 - data[i] * 1);
    }
  }
  if (mode == 2) {
    ctx.clearRect(0, 0, ctx.width, ctx.height);
    let threshold = 0;
    ctx.save();
    ctx.globalCompositeOperation = "source-over";

    ctx.scale(0.5, 0.5);
    ctx.translate(canvas.width, canvas.height);
    ctx.fillStyle = "#fff";

    let bass = Math.floor(data[1]); //1Hz Freq
    let radius =
      0.2 * canvas.width <= 200
        ? -(bass * 0.25 + 0.2 * canvas.width)
        : -(bass * 0.25 + 200);

    let bar_length_factor = 1;

    for (let i = 0; i < 256; i++) {
      let value = data[i];
      if (value >= threshold) {
        ctx.fillRect(
          0,
          radius,
          canvas.width <= 450 ? 2 : 3,
          -value / bar_length_factor
        );
        ctx.rotate(((180 / 128) * Math.PI) / 180);
      }
    }
    ctx.restore();
  }
  if (mode == 1) {
    ctx.stroke();
  }
  requestAnimationFrame(drawBars);
};
let timerId = requestAnimationFrame(drawBars);

playSound.addEventListener("click", (playEvent) => {
  let label;
  if (playEvent.target.textContent === "ストップ") {
    audioBufferSrc.stop(0);
    cancelAnimationFrame(timerId);
    label = "プレビュー";
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
  playEvent.target.textContent = label;
});
