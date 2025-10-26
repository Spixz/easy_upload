import { ChromeBridgeMessage } from "@/commons/communications_interfaces";
import { sendToSidepanel } from "./sw_sidepanel_bridge";

let offscreenPort: chrome.runtime.Port | null = null;
let unsentMessages: ChromeBridgeMessage[] = [];

export function initOffscreenBridge() {
  if (offscreenPort) return;

  console.log("[OffscreenBridge] Initialisation...");

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "offscreen-channel") {
      console.log("[OffscreenBridge] ✅ Offscreen connecté au Service Worker");
      offscreenPort = port;

      port.onMessage.addListener((msg: ChromeBridgeMessage) => {
        console.log("[OffscreenBridge] ← Message Offscreen :", msg);
        handleOffscreenMessage(msg);
      });

      port.onDisconnect.addListener(() => {
        console.warn("[OffscreenBridge] ⚠️ Offscreen déconnecté");
        offscreenPort = null;
      });

      unsentMessages.forEach(sendToOffscreen);
      unsentMessages = [];
    }
  });
}

export function sendToOffscreen(message: ChromeBridgeMessage) {
  if (offscreenPort) {
    offscreenPort.postMessage(message);
  } else {
    unsentMessages.push(message);
    console.warn(
      "[OffscreenBridge] Offscreen pas connecté → message en file :",
      message,
    );
  }
}

export async function ensureOffscreenCreated() {
  const existingDocs = await chrome.offscreen.hasDocument?.();

  if (existingDocs) {
    await chrome.offscreen.closeDocument();
  }

  console.log("[OffscreenBridge] 🧱 Création du document offscreen...");
  await chrome.offscreen.createDocument({
    url: chrome.runtime.getURL("src/offscreen/offscreen.html"),
    reasons: ["BLOBS", "WORKERS"],
    justification: "File modification with FFmpeg et ImageMagick",
  });
  console.log("[OffscreenBridge] ✅ Offscreen créé");
}

function handleOffscreenMessage(msg: ChromeBridgeMessage) {
  switch (msg.name) {
    case "offscreen-ready":
      console.log("[OffscreenBridge] Offscreen ready :", msg.data);
      break;
    case "ffmpeg-result":
      console.log("[OffscreenBridge] 🎬 Résultat FFmpeg reçu :", msg.data);
      break;
    case "magick-result":
      console.log("[SW] 🖼️ Résultat ImageMagick reçu :", msg.data);
      break;
    case "exec-command-in-offscreen-resp":
      sendToSidepanel(msg);
      break;

    default:
      console.warn("[OffscreenBridge] Message inconnu :", msg);
  }
}

export async function pingOffscreen() {
  await ensureOffscreenCreated();
  sendToOffscreen({ name: "ping", data: "👋 Hello depuis le Service Worker" });
}
