import "./@types/window.d";
import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.scss";

import { useState, useRef, useEffect } from "react";
import { Button, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import {
  FiberManualRecord,
  LibraryMusic,
  PhotoLibrary,
  VideoLibrary,
} from "@mui/icons-material";
import { CustomSnackbar } from "../components/CustomSnackbar";
import { drawBars } from "../scripts/Canvas";
import { generateMp4Video } from "../scripts/Ffmpeg";

const Home: NextPage = () => {
  if (typeof window !== "undefined") {
    // ブラウザによって異なる関数名を定義
    window.requestAnimationFrame =
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame;
    window.AudioContext =
      window.AudioContext ||
      window.webkitAudioContext ||
      window.mozAudioContext;

    // 離脱ガード
    window.addEventListener("beforeunload", (e) => {
      e.preventDefault();
      e.returnValue = "作成した動画は保存されませんが、よろしいですか？";
    });
  }

  // UI State
  const [isPlaySound, setIsPlaySound] = useState<boolean>(false);
  const [playSoundDisabled, setPlaySoundDisabled] = useState<boolean>(true);
  const [recordMovieDisabled, setRecordMovieDisabled] = useState<boolean>(true);

  // Audio State
  const audioCtxRef = useRef<AudioContext>(null);
  const streamDestinationRef = useRef<MediaStreamAudioDestinationNode>(null);
  const analyserRef = useRef<AnalyserNode>(null);
  useEffect(() => {
    // AudioContext
    audioCtxRef.current = new AudioContext();

    // AnalyserNode
    const analyserNode = audioCtxRef.current.createAnalyser();
    analyserNode.fftSize = 2048;
    analyserRef.current = analyserNode;

    // MediaStreamAudioDestinationNode(動画出力用)
    const steamDest = audioCtxRef.current.createMediaStreamDestination();
    streamDestinationRef.current = steamDest;
  }, []);
  const audioBufferSrcRef = useRef<AudioBufferSourceNode>(null);
  const decodedAudioBufferRef = useRef<AudioBuffer>(null);
  const setAudioBufferSourceNode = () => {
    // AudioBufferSourceNode作成
    const audioBufferSourceNode = audioCtxRef.current.createBufferSource();
    audioBufferSourceNode.buffer = decodedAudioBufferRef.current;
    audioBufferSourceNode.loop = false;
    // Node接続
    audioBufferSourceNode.connect(analyserRef.current);
    audioBufferSourceNode.connect(audioCtxRef.current.destination);
    audioBufferSourceNode.connect(streamDestinationRef.current);
    audioBufferSrcRef.current = audioBufferSourceNode;
  };

  // Mode
  const [mode, setMode] = useState(0);
  const onChangeMode = (event: SelectChangeEvent<string>) => {
    setMode(Number(event.target.value));
  };

  // Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reqIdRef = useRef<number>(null);
  // Canvas用ImageContext
  const [imageCtx, setImageCtx] = useState<HTMLImageElement>(null);
  // Canvas Animation
  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    reqIdRef.current = requestAnimationFrame(function () {
      return drawBars(canvasRef.current, imageCtx, mode, analyserRef.current);
    });
    return () => cancelAnimationFrame(reqIdRef.current);
  }, [imageCtx, mode]);

  // imageLoad
  const imageLoad = (event: { target: HTMLInputElement }) => {
    const imageFile = event.target.files[0];
    if (!imageFile) {
      return;
    }
    const image = new Image();
    image.onload = () => {
      if (!canvasRef.current) {
        return;
      }
      setImageCtx(image);
    };
    image.onerror = (e) => console.log(e);
    image.src = URL.createObjectURL(imageFile);
    openSnackBar("画像を読み込みました");
  };
  // AudioLoadEvent
  const audioLoad = async (event: { target: HTMLInputElement }) => {
    const audioFile = event.target.files[0];
    try {
      const arraybuffer = await audioFile.arrayBuffer();
      decodedAudioBufferRef.current = await audioCtxRef.current.decodeAudioData(
        arraybuffer
      );
      setPlaySoundDisabled(false);
      setRecordMovieDisabled(false);
      openSnackBar("音楽を読み込みました");
    } catch (error) {
      openSnackBar(error);
    }
  };

  // PlaySoundEvent
  const onPlaySound = () => {
    if (isPlaySound) {
      audioBufferSrcRef.current.stop(0);
      cancelAnimationFrame(reqIdRef.current);
      setIsPlaySound(false);
      return;
    }
    setAudioBufferSourceNode();
    audioBufferSrcRef.current.start(0);
    setIsPlaySound(true);
  };
  // RecordMovieEvent
  const onRecordMovie = () => {
    const audioStream = streamDestinationRef.current.stream;
    const canvasStream = canvasRef.current.captureStream();
    const outputStream = new MediaStream();
    [audioStream, canvasStream].forEach((stream) => {
      stream.getTracks().forEach(function (track: MediaStreamTrack) {
        outputStream.addTrack(track);
      });
    });
    //ストリームからMediaRecorderを生成
    const recorder = new MediaRecorder(outputStream, {
      mimeType: "video/webm;codecs=h264",
    });
    const recordedBlobs: Blob[] = [];
    recorder.addEventListener("dataavailable", (e) => {
      recordedBlobs.push(e.data);
    });
    //録画終了時に動画ファイルのダウンロードリンクを生成する処理
    recorder.addEventListener("stop", async () => {
      const movieName = "movie_" + Math.random().toString(36).slice(-8);
      const webmName = movieName + ".webm";
      const mp4Name = movieName + ".mp4";

      openSnackBar(
        "動画をmp4に変換しています...（時間がかかります、ブラウザ検証ツールにログがでます）"
      );
      const webmBlob = new Blob(recordedBlobs, { type: "video/webm" });
      const binaryData = new Uint8Array(await webmBlob.arrayBuffer());
      const video = await generateMp4Video(binaryData, webmName, mp4Name);
      const mp4Blob = new Blob([video], { type: "video/mp4" });
      const objectURL = URL.createObjectURL(mp4Blob);

      const a = document.createElement("a");
      a.href = objectURL;
      a.download = mp4Name;
      a.click();
      a.remove();
      openSnackBar("動画の変換が完了しました！");
      setRecordMovieDisabled(false);
    });
    recorder.start();
    openSnackBar("動画を録画しています...");
    onPlaySound();
    setRecordMovieDisabled(true);
    audioBufferSrcRef.current.onended = () => {
      recorder.stop();
    };
  };

  // SnackBar
  const [snackBarProps, setSnackBarProps] = useState({
    isOpen: false,
    message: "",
  });
  const openSnackBar = (message: string) => {
    setSnackBarProps({ isOpen: true, message });
  };
  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackBarProps({ isOpen: false, message: snackBarProps.message });
  };

  const baseURL = "https://music-waves-visualizer.vercel.app/";
  return (
    <>
      <Head>
        <title>Music Waves Visualizer</title>
        <meta
          name="description"
          content="画像と音楽を読み込んで音声波形動画を作成するWebページです。"
        />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta
          name="format-detection"
          content="telephone=no, email=no, address=no"
        />
        <meta property="og:title" content="Music Waves Visualizer" />
        <meta
          property="og:description"
          content="画像と音楽を読み込んで音声波形動画を作成するWebページです。"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={baseURL} />
        <meta property="og:image" content={baseURL + "waves.png"} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content="@komura_c" />
        <meta name="twitter:creator" content="@komura_c" />
        <link rel="apple-touch-icon" href={baseURL + "waves.png"} />
        <link rel="shortcut icon" href={baseURL + "favicon.ico"} />
      </Head>

      <main>
        <div className={styles.heading}>
          <h1 className={styles.heading__title}>Music Waves Visualizer</h1>
          <div className={styles.heading__text}>
            <p>画像と音楽を読み込んで音声波形動画を作成するWebページです。</p>
            <p>※iOS, Android未確認です。動画はmp4形式で出力されます。</p>
          </div>
        </div>

        <div className={styles.menu}>
          <div className={styles.menu__left}>
            <div className={styles.menu__item}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoLibrary />}
              >
                画像ファイルを選ぶ
                <input
                  type="file"
                  accept="image/*"
                  onChange={imageLoad}
                  hidden
                />
              </Button>
            </div>
            <div className={styles.menu__item}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<LibraryMusic />}
              >
                音楽ファイルを選ぶ
                <input
                  type="file"
                  accept="audio/*"
                  onChange={audioLoad}
                  hidden
                />
              </Button>
            </div>
          </div>
          <div className={styles.menu__right}>
            <div className={styles.menu__item}>
              <Button
                variant="outlined"
                startIcon={<VideoLibrary />}
                disabled={playSoundDisabled}
                onClick={onPlaySound}
              >
                {isPlaySound ? "ストップ" : "プレビュー"}
              </Button>
            </div>
            <div className={styles.menu__item}>
              <Button
                variant="outlined"
                startIcon={<FiberManualRecord />}
                disabled={recordMovieDisabled || isPlaySound}
                onClick={onRecordMovie}
              >
                動画を録画
              </Button>
            </div>
          </div>
          <div className={styles.select}>
            <Select value={mode.toString()} onChange={onChangeMode}>
              <MenuItem value={0}>周波数バー</MenuItem>
              <MenuItem value={1}>折れ線</MenuItem>
              <MenuItem value={2}>円形</MenuItem>
            </Select>
          </div>
        </div>

        <canvas
          className={styles.canvas}
          width="1024"
          height="512"
          ref={canvasRef}
        ></canvas>
      </main>

      <CustomSnackbar
        {...snackBarProps}
        handleClose={handleClose}
      ></CustomSnackbar>

      <footer className={styles.footer}>&copy; komura-c</footer>
    </>
  );
};

export default Home;
