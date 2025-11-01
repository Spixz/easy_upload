import { ChromeBridgeMessage } from "@/commons/communications_interfaces";
import {
  generateRandomString,
} from "@/commons/helpers/helpers";
import { addChunkedListenerOnPort } from "@/vendors/ext-send-chuncked-message";
import { TasksSessionManagerNotifier } from "../tools/tasks_session_manager";
import UserFileMessage from "../conversation/messages/user_file_message";
import { ConversationNotifier } from "../conversation/ConversationNotifier";

export var contentScriptPort: chrome.runtime.Port | null = null;
var unsendMessages: ChromeBridgeMessage[] = [];

export function initContentScriptBridge() {
  if (contentScriptPort != null) return;

  console.log("[Sidepanel TO ContentScriptBridge] Initialisation...");

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "sidepanel-content-script-channel") {
      contentScriptPort = port;
      console.log("[panel-content-script-bridge] sidepanel conneted to CS");

      addChunkedListenerOnPort(contentScriptPort, handleFileReception);

      contentScriptPort.onDisconnect.addListener(() => {
        console.log(
          "[panel-content-script-bridge] CS disconnected of service worker",
        );

        contentScriptPort = null;
      });

      unsendMessages.forEach(sendToContentScript);
      unsendMessages = [];
    }
  });
}

export function sendToContentScript(message: ChromeBridgeMessage) {
  if (contentScriptPort) {
    contentScriptPort.postMessage(message);
  } else {
    unsendMessages.push(message);
    console.warn(
      "[panel => content-script] error: No active content-script connection",
    );
  }
}

async function handleFileReception(message: any) {
  console.log("big chunk received fron CS to SIDEPANEL");

  const response = await fetch(
    `data:application/octet-stream;base64,${message.data}`,
  );
  const bytes = await response.blob();

  if (bytes.size == 0) {
    console.log("File send by the user is empty");
    return;
  }

  const filename = generateRandomString();
  const root = await navigator.storage.getDirectory();
  const fileHandle = await root.getFileHandle(filename, {
    create: true,
  });
  const writable = await fileHandle.createWritable();

  await writable.write(bytes);
  await writable.close();

  TasksSessionManagerNotifier.getState().setFileToWorkOn(filename);
  const userFileMessage = new UserFileMessage({
    title: "File from website form",
    opfsFilename: filename,
    showInjectButton: false,
  });
  ConversationNotifier.getState().addMessage(userFileMessage);
}
