import Head from "next/head";
import type { AppProps } from "next/app";
import React from "react";
import "../styles/globals.scss";
import { GoogleAnalytics, usePageView } from "../lib/Gtag";

const baseURL = process.env.NEXT_PUBLIC_DOMAIN;

const App = ({ Component, pageProps }: AppProps) => {
  usePageView();

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

      <GoogleAnalytics />

      <Component {...pageProps} />
    </>
  );
};

export default App;
