import { createFFmpeg } from "@ffmpeg/ffmpeg";

export async function generateMp4Video(
  binaryData: Uint8Array,
  webmName: string,
  mp4Name: string
) {
  const ffmpeg = createFFmpeg({ log: true });
  await ffmpeg.load();
  ffmpeg.FS("writeFile", webmName, binaryData);
  await ffmpeg.run("-i", webmName, "-vcodec", "copy", mp4Name);
  return ffmpeg.FS("readFile", mp4Name);
}
