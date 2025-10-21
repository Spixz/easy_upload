import offscreenPort from "./offscreen_port";

const Magick = await import(
  /* @vite-ignore */ chrome.runtime.getURL("wasm/magickApi.js")
);

let magickModule: any = null;

// async function ensureMagick() {
//   if (magickModule) return magickModule;
//   console.log("[Offscreen] Chargement de ImageMagick.wasm...");
//   const mod = await import(
//     /* @vite-ignore */ chrome.runtime.getURL("wasm/magick.js")
//   );
//   magickModule = await mod.default({
//     locateFile: (f: string) => chrome.runtime.getURL(`wasm/${f}`),
//   });
//   console.log("[Offscreen] ✅ ImageMagick prêt");
//   return magickModule;
// }

export async function basicManip() {
  const imageUrl = chrome.runtime.getURL("FriedrichNietzsche.png");

  // ✅ vérifier que le fichier existe bien
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("Image introuvable : " + imageUrl);

  let arrayBuffer = await response.arrayBuffer();
  let sourceBytes = new Uint8Array(arrayBuffer);

  // calling ImageMagick with one source image, and command to rotate & resize image
  // file-type pour 
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

// async function magickConvert(fileData: {
//   arrayBuffer: ArrayBuffer;
//   name: string;
// }) {
//   const magick = await ensureMagick();
//   magick.FS.writeFile(fileData.name, new Uint8Array(fileData.arrayBuffer));
//   await magick.callMain([
//     "convert",
//     fileData.name,
//     "-resize",
//     "512x512",
//     "output.png",
//   ]);
//   const out = magick.FS.readFile("output.png");
//   offscreenPort.postMessage({ name: "magick-result", data: out.buffer });
// }