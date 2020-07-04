// imageLoad
const imageLoad = () => {
  imageFile = document.querySelector("input#imageFile").files[0];
  imageName.textContent = imageFile.name;
  // readerのresultプロパティに、データURLとしてエンコードされたファイルデータを格納
  let reader = new FileReader();
  reader.onload = () => {
    imageData = reader.result;
    imageCtx.onload = () => {
      rawWidth = imageCtx.width;
      rawHeight = imageCtx.height;
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
    };
    imageCtx.src = imageData;
  };
  reader.readAsDataURL(imageFile);
  M.toast({
    html: "画像を読み込みました",
    classes: "js-toast",
  });
};

// audioLoad
const LoadSample = (audioCtx, audioDataUrl) => {
  fetch(audioDataUrl)
    .then((response) => {
      return response.arrayBuffer();
    })
    .then((arrayBuffer) => {
      audioCtx.decodeAudioData(arrayBuffer).then((decodedData) => {
        buffer = decodedData;
      });
    })
    .catch((error) => {
      M.toast({ html: error, classes: "js-toast" });
    });
};

const audioLoad = () => {
  audioFile = document.querySelector("input#audioFile").files[0];
  audioName.textContent = audioFile.name;
  // readerのresultプロパティに、データURLとしてエンコードされたファイルデータを格納
  let reader = new FileReader();
  reader.onload = () => {
    audioData = reader.result;
    LoadSample(audioCtx, audioData);
    playSound.removeAttribute("disabled");
    recordMovie.removeAttribute("disabled");
    M.toast({
      html: "音楽を読み込みました",
      classes: "js-toast",
    });
  };
  reader.readAsDataURL(audioFile);
};
