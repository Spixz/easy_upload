import "webext-bridge/background";
import { ensureOffscreenCreated, sendToOffscreen } from "./sw_offscreen_bridge";
import { sendToSidepanel } from "./sw_sidepanel_bridge";
import { onMessage } from "webext-bridge/background";
import { ChromeBridgeMessage } from "@/commons/communications_interfaces";
import { getFileInOPFS } from "@/commons/helpers/helpers";
import { sendChunkedMessage } from "@/vendors/ext-send-chuncked-message";

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
        { channel: "sw-to-cc", tabId: sidePanelTabId },
      );

      break;
    default:
      console.warn("[SidepanelBridge] Message inconnu :", message);
  }
}

// From content script
onMessage("open_sidepanel", async ({ data, sender }) => {
  ensureOffscreenCreated();

  console.log(chrome.storage.session);
  chrome.storage.session.set({
    sidePanelOpenReason: "CONTENT_SCRIPT_REQUEST",
  });
  await chrome.sidePanel.open({ tabId: sender.tabId });
});

onMessage("input_unprocess_requirements", async ({ data, sender }) => {
  sendToSidepanel({
    name: "input_unprocess_requirements",
    data: data.raw_requirements,
  } as ChromeBridgeMessage);
});

chrome.windows.onRemoved.addListener(async (windowId) => {
  sendToSidepanel({
    name: "window_closed",
    data: { id: windowId },
  } as ChromeBridgeMessage);
});
