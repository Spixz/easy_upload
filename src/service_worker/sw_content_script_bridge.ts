import { ChromeBridgeMessage } from "@/commons/communications_interfaces";
import { handleContentScriptMessage } from "./service_worker_listener";

let contentScriptPort: chrome.runtime.Port | null = null;
let unsendMessages: ChromeBridgeMessage[] = [];

export function initContentScriptBridge() {
  if (contentScriptPort != null) return;

  console.log("[SW TO ContentScriptBridge] Initialisation...");

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "sw-content-script-channel") {
      console.log("[SW TO ContentScriptBridge] service worker conneted to CS");

      getActiveTabId().then((sidePanelTabId) => {
        contentScriptPort = port;

        contentScriptPort.onMessage.addListener((msg: ChromeBridgeMessage) => {
          console.log("[SW TO ContentScriptBridge] Received from CS:", msg);
          handleContentScriptMessage(sidePanelTabId, msg);
        });

        contentScriptPort.onDisconnect.addListener(() => {
          console.log(
            "[SW TO ContentScriptBridge] CS disconnected of service worker",
          );
          contentScriptPort = null;
        });

        unsendMessages.forEach(sendToContentScript);
        unsendMessages = [];
      });
    }
  });
}

export function sendToContentScript(message: ChromeBridgeMessage) {
  if (contentScriptPort) {
    contentScriptPort.postMessage(message);
  } else {
    unsendMessages.push(message);
    console.warn(
      "[SW TO ContentScriptBridge] error: No active content-script connection",
    );
  }
}

async function getActiveTabId(): Promise<number | undefined> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.id;
}
