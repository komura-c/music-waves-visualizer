export {};
declare global {
  interface Window {
    webkitRequestAnimationFrame: typeof window.requestAnimationFrame;
    mozRequestAnimationFrame: typeof window.requestAnimationFrame;
    webkitAudioContext: typeof window.AudioContext;
    mozAudioContext: typeof window.AudioContext;
  }
}
