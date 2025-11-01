import { detectFileExt } from "@/commons/helpers/helpers";
import MessagesLibrary from "@/commons/messages_library";
import {
  sendChunkedMessage,
  addChunkedListenerOnPort,
} from "@/vendors/ext-send-chuncked-message";
import { startInjectionMode } from "../injection_state";
import { displayErrorMessage, displayMessage } from "../display_message";

export const serviceWorkerPort = chrome.runtime.connect({
  name: "sw-content-script-channel",
});
export var portToSidepanel: chrome.runtime.Port | null = null;

let isConnecting = false;

function getConnection(): chrome.runtime.Port | null {
  if (portToSidepanel) {
    return portToSidepanel;
  }

  if (isConnecting) {
    console.log("[CS->Sidepanel] Connection already in progress...");
    return null;
  }

  try {
    isConnecting = true;
    console.log("[CS->Sidepanel] Attempting to connect...");

    portToSidepanel = chrome.runtime.connect({
      name: "sidepanel-content-script-channel",
    });

    portToSidepanel.onDisconnect.addListener(() => {
      console.warn("[CS->Sidepanel] Port disconnected.");
      portToSidepanel = null;
    });

    console.log("[CS->Sidepanel] Connection successful.");
    addChunkedListenerOnPort(portToSidepanel, onFileChunckReception);
    isConnecting = false;
    return portToSidepanel;
  } catch (error) {
    console.error(
      "[CS->Sidepanel] Connection failed. The sidepanel is likely closed.",
      error,
    );
    portToSidepanel = null;
    isConnecting = false;
    return null;
  }
}

export function sendFileToSidepanel(message: any): boolean {
  const port = getConnection();

  if (port) {
    console.log("[CS->Sidepanel] Sending file:", message);
    sendChunkedMessage(message, { port });
    return true;
  } else {
    console.warn(
      "[CS->Sidepanel] Could not send message: no active connection.",
    );
    return false;
  }
}

function onFileChunckReception(
  message: any,
  sender: chrome.runtime.MessageSender,
) {
  console.log("cs: donnes recued du du sidepannel");
  console.log(message);

  const bytes = new Uint8Array(message.data);
  if (bytes.length == 0) {
    displayErrorMessage(MessagesLibrary.filToReinjectIsEmpty);
    return;
  }

  detectFileExt(new Blob([bytes])).then((fileFormat) => {
    const extension = fileFormat?.ext;
    const filename =
      fileFormat?.ext != null ? `injected_file.${extension}` : "injected_file";
    const fileToInject = new File([bytes], filename, {
      type: fileFormat?.mime ?? "",
    });
    startInjectionMode(fileToInject);

    displayMessage(MessagesLibrary.clickOnTheFiledToReinjectYourFile);
  });
}
