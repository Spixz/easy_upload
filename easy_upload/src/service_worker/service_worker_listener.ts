import "webext-bridge/background";
import { ensureOffscreenCreated, sendToOffscreen } from "./sw_offscreen_bridge";
import { sendToSidepanel } from "./sw_sidepanel_bridge";
import { onMessage } from "webext-bridge/background";
import { ChromeBridgeMessage } from "@/commons/interfaces";
import { addOnChunkedMessageListener } from "ext-send-chunked-message";

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "upload-to-sw") {
    // handleUploadPort(port);
  }
});


addOnChunkedMessageListener(async (message, sender, sendResponse) => {
  console.log("📩 Message reçu de", sender);
  console.log("📦 Données reçues:", message);

  const bytes = new Uint8Array(message.data);

  const root = await navigator.storage.getDirectory();
  const fileHandle = await root.getFileHandle("user_input_file", { create: true });
  const writable = await fileHandle.createWritable();

  await writable.write(bytes);
  await writable.close();
  console.log("✅ Fin de l'écriture du fichier");

//   // 🧠 Vérification : relis le fichier pour confirmer sa taille
//   const savedHandle = await root.getFileHandle("user_input_file");
//   const savedFile = await savedHandle.getFile();

//   console.log("📏 Taille sauvegardée :", savedFile.size, "octets");

//   if (savedFile.size === bytes.byteLength) {
//     console.log("✅ Vérification réussie : tailles identiques !");
//   } else {
//     console.warn(
//       "⚠️ Taille différente ! attendu:",
//       bytes.byteLength,
//       "obtenu:",
//       savedFile.size
//     );
//   }
});

onMessage("open_sidepanel", async ({ data, sender }) => {
  ensureOffscreenCreated();
  sendToOffscreen({ name: "test-imagemagick" });
  await chrome.sidePanel.open({ tabId: sender.tabId });
  console.log("Ouveture tu side panel demandé");
  try {
    console.log("Envoie des donne vers le pannel");
    sendToSidepanel({
      name: "input_unprocess_requirements",
      data: data.raw_requirements,
    } as ChromeBridgeMessage);
  } catch (err) {
    console.error("erreur durant l'envoie des donnes au pannel", err);
  }
});

