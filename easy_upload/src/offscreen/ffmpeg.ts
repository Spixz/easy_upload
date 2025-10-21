import { FFmpeg } from "@ffmpeg/ffmpeg";
const ffmpegInstance: FFmpeg = new FFmpeg();

export async function ensureFFmpeg() {
  console.log("[Offscreen] Chargement de FFmpeg multi-core...");
  await ffmpegInstance.load({
    coreURL: chrome.runtime.getURL("wasm/ffmpeg-core.js"),
    wasmURL: chrome.runtime.getURL("wasm/ffmpeg-core.wasm"),
    workerURL: chrome.runtime.getURL("wasm/ffmpeg-core.worker.js"),
  });

  console.log("[Offscreen] ✅ FFmpeg multi-core prêt");
  return ffmpegInstance;
}

export async function ffmpegConvert(fileData: {
  arrayBuffer: ArrayBuffer;
  name: string;
}) {
  const ffmpeg = await ensureFFmpeg();
  const inputName = fileData.name;
  const outputName = "output.mp4";

  //   ffmpeg.writeFile("writeFile", inputName, new Uint8Array(fileData.arrayBuffer));
  //   await ffmpeg.run("-i", inputName, "-vf", "scale=640:-1", outputName);
  //   const data = ffmpeg.FS("readFile", outputName);
  //   port.postMessage({ name: "ffmpeg-result", data: data.buffer });
}

export default ffmpegInstance;
