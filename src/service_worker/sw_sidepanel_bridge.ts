import { ChromeBridgeMessage } from "@/commons/communications_interfaces";
import { handleSidepanelMessage } from "./service_worker_listener";

let sidepanelPort: chrome.runtime.Port | null = null;
let unsendMessages: ChromeBridgeMessage[] = [];

export function initSidepanelBridge() {
  if (sidepanelPort != null) return;

  console.log("[SW TO SidepannelBridge] Initialisation...");

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "sidepanel-channel") {
      console.log(
        "[SW TO SidepannelBridge] service worker conneted to Sidepanel",
      );

      getActiveTabId().then((sidePanelTabId) => {
        sidepanelPort = port;

        sidepanelPort.onMessage.addListener((msg: ChromeBridgeMessage) => {
          console.log("[SW TO SidepannelBridge] Received from sidepanel:", msg);
          handleSidepanelMessage(sidePanelTabId, msg);
        });

        sidepanelPort.onDisconnect.addListener(() => {
          console.log(
            "[SW TO SidepannelBridge] Sidepanel disconnected of service worker",
          );
          sidepanelPort = null;
        });

        unsendMessages.forEach(sendToSidepanel);
        unsendMessages = [];
      });
    }
  });
}

export function sendToSidepanel(message: ChromeBridgeMessage) {
  if (sidepanelPort) {
    sidepanelPort.postMessage(message);
  } else {
    unsendMessages.push(message);
    console.warn(
      "[SW TO SidepannelBridge] error: No active sidepanel connection",
    );
  }
}

async function getActiveTabId(): Promise<number | undefined> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.id;
}
