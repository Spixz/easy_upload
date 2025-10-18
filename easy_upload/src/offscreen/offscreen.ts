// =============================
// Offscreen Document (TypeScript + Vite)
// =============================

import { FFmpeg } from "@ffmpeg/ffmpeg";
// const ImageMagick = await import(chrome.runtime.getURL("wasm/magick.js"));
const Magick = await import(
  /* @vite-ignore */ chrome.runtime.getURL("wasm/magickApi.js")
);


// Charger le runtime wasm
Magick.getFileName("FriedrichNietzsche.png");
// Type de message unifié
export interface ChromeBridgeMessage {
  name: string;
  data: any;
}

// Port vers le Service Worker
const offscreenPort = chrome.runtime.connect({ name: "offscreen-channel" });
const ffmpegInstance: FFmpeg = new FFmpeg();

offscreenPort.onMessage.addListener(async (msg: ChromeBridgeMessage) => {
  console.log("[Offscreen] ← Message du SW :", msg);

  switch (msg.name) {
    case "ping-from-sidepanel":
      offscreenPort.postMessage({
        name: "pong",
        data: "👋 Hello depuis Offscreen",
      });
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

    case "test-imagemagick":
      console.log("offscreen : message recu pour manip fichier imagemagick");
      basicManip();
      break;

    default:
      console.warn("[Offscreen] Message inconnu :", msg);
  }
});

async function basicManip() {
  const imageUrl = chrome.runtime.getURL("FriedrichNietzsche.png");

  // ✅ vérifier que le fichier existe bien
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("Image introuvable : " + imageUrl);

  let arrayBuffer = await response.arrayBuffer();
  let sourceBytes = new Uint8Array(arrayBuffer);

  // calling ImageMagick with one source image, and command to rotate & resize image
  const inputFiles = [{ name: "srcFile.png", content: sourceBytes }];
  const command = [
    "convert",
    "srcFile.png",
    "-rotate",
    "90",
    "-resize",
    "200%",
    "out.png",
  ];
  let processedFiles = await Magick.Call(inputFiles, command);

  // response can be multiple files (example split) here we know we just have one
  let firstOutputImage = processedFiles[0];
  // outputImage.src = URL.createObjectURL(firstOutputImage['blob'])
  console.log("[Offscreen] ✅ Image créée :", firstOutputImage.name);

  // 🔥 Créer un Blob à partir du fichier de sortie
  const blob = firstOutputImage.blob;
  const arrayBufferOut = await blob.arrayBuffer();

  // ✅ Envoyer le blob au Service Worker
  offscreenPort.postMessage({
    name: "magick-result",
    data: {
      blob: arrayBufferOut,
      type: blob.type,
      name: firstOutputImage.name,
    },
  });
}

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

async function ensureImageMagick() {}

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
  offscreenPort.postMessage({ name: "magick-result", data: out.buffer });
}

console.log("[Offscreen] 🚀 Offscreen TS initialisé");
offscreenPort.postMessage({
  name: "offscreen-ready",
  data: "WASM chargés quand besoin",
});
