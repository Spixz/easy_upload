import { ChromeBridgeMessage } from "@/commons/interfaces";

let sidepanelPort: chrome.runtime.Port | null = null;
let unsendMessages: ChromeBridgeMessage[] = [];

export function initSidepanelBridge() {
  if (sidepanelPort != null) return;

  console.log("[SidepannelBridge] Initialisation...");

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "sidepanel-channel") {
      console.log("[Bridge] service worker conneted to Sidepanel");
      sidepanelPort = port;

      unsendMessages.forEach(sendToSidepanel);
      unsendMessages = [];

      sidepanelPort.onMessage.addListener((msg: ChromeBridgeMessage) => {
        console.log("[sw-Bridge] Received from sidepanel:", msg);
        handleSidepanelMessage(msg);
      });

      sidepanelPort.onDisconnect.addListener(() => {
        console.log("[sw-Bridge] Sidepanel disconnected of service worker");
        sidepanelPort = null;
      });
    }
  });
}

export function sendToSidepanel(message: ChromeBridgeMessage) {
  if (sidepanelPort) {
    sidepanelPort.postMessage(message);
  } else {
    unsendMessages.push(message);
    console.warn("[SW => sidepanel] error: No active sidepanel connection");
  }
}

function handleSidepanelMessage(message: ChromeBridgeMessage) {
  switch (message.name) {
    case "salut":
      console.log("Salut recu du pannel au worker");
      break;
    default:
      console.warn("[SidepanelBridge] Message inconnu :", message);
  }
}
