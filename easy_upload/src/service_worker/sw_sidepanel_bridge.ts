export interface ChromeBridgeMessage {
  name: string;
  data: any;
}

let port: chrome.runtime.Port | null = null;
let unsendMessages: ChromeBridgeMessage[] = [];

export function initSidepanelBridge() {
  if (port != null) return;

  chrome.runtime.onConnect.addListener((p) => {
    if (p.name === "sidepanel-channel") {
      console.log("[Bridge] service worker conneted to Sidepanel");
      port = p;

      unsendMessages.forEach(sendToSidepanel);

      port.onMessage.addListener((msg: ChromeBridgeMessage) => {
        console.log("[Bridge] Received from sidepanel:", msg);
        if (msg.name == "salut") {
          console.log("Salut recu du pannel au worker");
        }
      });

      port.onDisconnect.addListener(() => {
        console.log("[Bridge] Sidepanel disconnected of service worker");
        port = null;
      });
    }
  });
}

export function sendToSidepanel(message: ChromeBridgeMessage) {
  if (port) {
    port.postMessage(message);
  } else {
    unsendMessages.push(message);
    console.warn("[SW => sidepanel] error: No active sidepanel connection");
  }
}
