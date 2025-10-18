// =============================
// Offscreen Document (TypeScript + Vite)
// =============================

import { FFmpeg } from "@ffmpeg/ffmpeg";

// Type de message unifié
export interface ChromeBridgeMessage {
  name: string;
  data: any;
}

// Port vers le Service Worker
const port = chrome.runtime.connect({ name: "offscreen-channel" });

port.onMessage.addListener(async (msg: ChromeBridgeMessage) => {
  console.log("[Offscreen] ← Message du SW :", msg);

  switch (msg.name) {
    case "ping-from-sidepanel":
      // Exemple de réponse simple
      port.postMessage({ name: "pong", data: "👋 Hello depuis Offscreen" });
      break;

    case "convert-video":
      await ensureFFmpeg();
      console.log("[Offscreen] ffmpeg prêt, conversion...");
      await ffmpegConvert(msg.data);
      break;

    case "convert-image":
      await ensureMagick();
      console.log("[Offscreen] imagemagick prêt, conversion...");
      await magickConvert(msg.data);
      break;

    default:
      console.warn("[Offscreen] Message inconnu :", msg);
  }
});

// =============================
// Chargement WASM : FFmpeg
// =============================
const ffmpegInstance: FFmpeg = new FFmpeg();

async function ensureFFmpeg() {
  console.log("[Offscreen] Chargement de FFmpeg multi-core...");
  await ffmpegInstance.load({
    coreURL: chrome.runtime.getURL("wasm/ffmpeg-core.js"),
    wasmURL: chrome.runtime.getURL("wasm/ffmpeg-core.wasm"),
    workerURL: chrome.runtime.getURL("wasm/ffmpeg-core.worker.js"),
  });

  console.log("[Offscreen] ✅ FFmpeg multi-core prêt");
  return ffmpegInstance;
}

async function ffmpegConvert(fileData: {
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

// =============================
// Chargement WASM : ImageMagick
// =============================
let magickModule: any = null;

async function ensureMagick() {
  if (magickModule) return magickModule;
  console.log("[Offscreen] Chargement de ImageMagick.wasm...");
  const mod = await import(
    /* @vite-ignore */ chrome.runtime.getURL("wasm/magick.js")
  );
  magickModule = await mod.default({
    locateFile: (f: string) => chrome.runtime.getURL(`wasm/${f}`),
  });
  console.log("[Offscreen] ✅ ImageMagick prêt");
  return magickModule;
}

async function magickConvert(fileData: {
  arrayBuffer: ArrayBuffer;
  name: string;
}) {
  const magick = await ensureMagick();
  magick.FS.writeFile(fileData.name, new Uint8Array(fileData.arrayBuffer));
  await magick.callMain([
    "convert",
    fileData.name,
    "-resize",
    "512x512",
    "output.png",
  ]);
  const out = magick.FS.readFile("output.png");
  port.postMessage({ name: "magick-result", data: out.buffer });
}

console.log("[Offscreen] 🚀 Offscreen TS initialisé");
port.postMessage({
  name: "offscreen-ready",
  data: "WASM chargés quand besoin",
});
