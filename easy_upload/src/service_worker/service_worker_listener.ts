import "webext-bridge/background";
import { ensureOffscreenCreated, sendToOffscreen } from "./sw_offscreen_bridge";
import { sendToSidepanel } from "./sw_sidepanel_bridge";
import { ChromeBridgeMessage } from "@/commons/communications_interfaces";

chrome.runtime.onMessage.addListener(onGlobalMessageReceived);

function onGlobalMessageReceived(
  message: ChromeBridgeMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void,
) {
  console.log("SW: message recu");
  console.log(message);
  if (message.name == "ui_image_editor_closed") {
    console.log("message recu ves le side pannel pour close");
    sendToSidepanel(message);
    sendResponse({});

    return true;
  }
}

export async function handleSidepanelMessage(
  sidePanelTabId: number | undefined,
  message: ChromeBridgeMessage,
) {
  switch (message.name) {
    case "exec-command-in-offscreen":
      sendToOffscreen({
        name: "exec-command-in-offscreen",
        data: message.data,
      });
      break;
    default:
      console.warn("[SidepanelBridge] Message inconnu :", message);
  }
}

export async function handleContentScriptMessage(
  contentScriptTabId: number | undefined,
  message: ChromeBridgeMessage,
) {
  switch (message.name) {
    case "open_sidepanel":
      ensureOffscreenCreated();

      console.log(chrome.storage.session);
      chrome.storage.session.set({
        sidePanelOpenReason: "CONTENT_SCRIPT_REQUEST",
      });
      await chrome.sidePanel.open({ tabId: contentScriptTabId! });
      break;
    case "input_unprocess_requirements":
      sendToSidepanel({
        name: "input_unprocess_requirements",
        data: message.data.raw_requirements,
      } as ChromeBridgeMessage);
      break;
    default:
      console.warn("[sw-content-script-bridge] Message inconnu :", message);
  }
}

chrome.windows.onRemoved.addListener(async (windowId) => {
  sendToSidepanel({
    name: "window_closed",
    data: { id: windowId },
  } as ChromeBridgeMessage);
});
