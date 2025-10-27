import { ChromeBridgeMessage } from "@/commons/communications_interfaces";
import { sendToOffscreen } from "./sw_offscreen_bridge";
import { getFileInOPFS } from "@/commons/helpers/helpers";
import { sendChunkedMessage } from "@/vendors/ext-send-chuncked-message";

let sidepanelPort: chrome.runtime.Port | null = null;
let unsendMessages: ChromeBridgeMessage[] = [];
let fileUploadTab: number | undefined;

export function initSidepanelBridge() {
  if (sidepanelPort != null) return;

  console.log("[SidepannelBridge] Initialisation...");

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "sidepanel-channel") {
      console.log("[Bridge] service worker conneted to Sidepanel");
      sidepanelPort = port;
      getActiveTabId().then((tabId) => (fileUploadTab = tabId));

      sidepanelPort.onMessage.addListener((msg: ChromeBridgeMessage) => {
        console.log("[sw-Bridge] Received from sidepanel:", msg);
        handleSidepanelMessage(msg);
      });

      sidepanelPort.onDisconnect.addListener(() => {
        console.log("[sw-Bridge] Sidepanel disconnected of service worker");
        sidepanelPort = null;
      });

      unsendMessages.forEach(sendToSidepanel);
      unsendMessages = [];
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

async function handleSidepanelMessage(message: ChromeBridgeMessage) {
  switch (message.name) {
    case "exec-command-in-offscreen":
      sendToOffscreen({
        name: "exec-command-in-offscreen",
        data: message.data,
      });
      break;
    case "inject-file":
      const filename: string = message.data;
      const file = await getFileInOPFS(filename);
      if (file == null) {
        console.warn("sw: file not found for injection");
        return;
      }

      const buff: ArrayBuffer = await file.arrayBuffer();
      sendChunkedMessage(
        {
          type: "inject-file",
          data: Array.from(new Uint8Array(buff)),
        },
        { channel: "sw-to-cc", tabId: fileUploadTab },
      );

      break;
    default:
      console.warn("[SidepanelBridge] Message inconnu :", message);
  }
}

async function getActiveTabId(): Promise<number | undefined> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.id;
}