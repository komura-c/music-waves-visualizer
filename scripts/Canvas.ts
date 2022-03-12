export const drawBars = (
  canvas: HTMLCanvasElement,
  imageCtx: HTMLImageElement,
  mode: number,
  analyser: AnalyserNode
) => {
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(34, 34, 34, 1.0)";
  ctx.fillRect(0, 0, 1024, 512);

  ctx.save();

  // drawImage
  if (imageCtx) {
    const rawWidth = imageCtx.width;
    const rawHeight = imageCtx.height;
    let imageCtxWidth = 0;
    let imageCtxHeight = 0;
    if (rawWidth > canvas.width || rawHeight > canvas.height) {
      imageCtxWidth = canvas.width;
      imageCtxHeight = Math.round(rawHeight * (canvas.width / rawWidth));
      do {
        imageCtxWidth -= 1;
        imageCtxHeight -= 1;
      } while (imageCtxWidth > canvas.width);
    } else {
      imageCtxWidth = imageCtx.width;
      imageCtxHeight = imageCtx.height;
    }
    const marginWidth = canvas.width - imageCtxWidth;
    const posX = marginWidth === 0 ? 0 : marginWidth / 2; // imageのwidthをcenterにする
    const marginHeight = canvas.height - imageCtxHeight;
    const posY = marginHeight === 0 ? 0 : marginHeight / 2; // imageのheightをcenterにする
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

  if (!analyser) {
    requestAnimationFrame(function () {
      drawBars(canvas, imageCtx, mode, analyser);
    });
    return;
  }

  const bufferLength = analyser.frequencyBinCount; // analyser.fftSizeの半分になる(1024)
  const bufferData = new Uint8Array(bufferLength);
  if (mode === 0) {
    analyser.getByteFrequencyData(bufferData); //spectrum data
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    const barsLength = 128;
    const barWidth = 1;
    let barX = 0;
    for (let i = 0; i < barsLength; i++) {
      const barHeight = bufferData[i];
      ctx.fillRect(barX, canvas.height - barHeight, barWidth, barHeight);
      barX += barWidth + canvas.width / 128;
    }
  } else if (mode === 1) {
    analyser.getByteTimeDomainData(bufferData); //Waveform Data
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.beginPath();
    for (let i = 0; i < bufferLength; i++) {
      ctx.lineTo(i, 384 - bufferData[i] * 1);
    }
    ctx.stroke();
  } else if (mode === 2) {
    analyser.getByteFrequencyData(bufferData); //spectrum data
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";

    ctx.scale(0.5, 0.5);
    ctx.translate(canvas.width, canvas.height);

    const bass = Math.floor(bufferData[1]); //1Hz Freq
    const radius =
      0.2 * canvas.width <= 200
        ? -(bass * 0.25 + 0.2 * canvas.width)
        : -(bass * 0.25 + 200);

    const threshold = 0;
    const barLengthFactor = 1;
    for (let i = 0; i < 256; i++) {
      let value = bufferData[i];
      if (value >= threshold) {
        ctx.fillRect(
          0,
          radius,
          canvas.width <= 450 ? 2 : 3,
          -value / barLengthFactor
        );
        ctx.rotate(((180 / 128) * Math.PI) / 180);
      }
    }
  }

  ctx.restore();

  requestAnimationFrame(function () {
    drawBars(canvas, imageCtx, mode, analyser);
  });
};
