import { ChromeBridgeMessage } from "@/commons/communications_interfaces";
import { sendToSidepanel } from "./sw_sidepanel_bridge";

let offscreenPort: chrome.runtime.Port | null = null;
let unsentMessages: ChromeBridgeMessage[] = [];

export function initOffscreenBridge() {
  if (offscreenPort) return;

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "offscreen-channel") {
      console.log("[OffscreenBridge] ✅ Offscreen connected to Service Worker");
      offscreenPort = port;

      port.onMessage.addListener((msg: ChromeBridgeMessage) => {
        handleOffscreenMessage(msg);
      });

      port.onDisconnect.addListener(() => {
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
  }
}

export async function ensureOffscreenCreated() {
  if (await chrome.offscreen.hasDocument?.()) {
    await chrome.offscreen.closeDocument();
  }

  await chrome.offscreen.createDocument({
    url: chrome.runtime.getURL("src/offscreen/offscreen.html"),
    reasons: ["BLOBS", "WORKERS"],
    justification: "File modification with FFmpeg et ImageMagick",
  });
  console.log("✅ Offscreen doc created");
}

function handleOffscreenMessage(msg: ChromeBridgeMessage) {
  switch (msg.name) {
    case "exec-command-in-offscreen-resp":
      sendToSidepanel(msg);
      break;
  }
}
