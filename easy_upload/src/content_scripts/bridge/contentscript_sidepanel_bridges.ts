import { detectFileExt } from "@/commons/helpers/helpers";
import MessagesLibrary from "@/commons/messages_library";
import {
  sendChunkedMessage,
  addChunkedListenerOnPort,
} from "@/vendors/ext-send-chuncked-message";
import { Notyf } from "notyf";

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
    portToSidepanel = null; // S'assurer que le port est bien null en cas d'erreur
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
  const selectedInputs: NodeListOf<HTMLInputElement> =
    document.querySelectorAll(
      'input[type="file"][data-input-selected-by-user]',
    );
  if (selectedInputs.length == 0) {
    displayErrorMessage(MessagesLibrary.uploadFieldNoLongerAvailaible);
    return;
  }
  const selectedInput = selectedInputs[0];

  const bytes = new Uint8Array(message.data);
  if (bytes.length == 0) {
    displayErrorMessage(MessagesLibrary.filToReinjectIsEmpty);
    return;
  }

  detectFileExt(new Blob([bytes])).then((fileFormat) => {
    const fileToInject = new File([bytes], "injected_file", {
      type: fileFormat?.ext ?? "",
    });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(fileToInject);
    selectedInput.files = dataTransfer.files;

    selectedInput.dispatchEvent(new Event("change", { bubbles: true }));
    console.log("File successfully injected");
  });
}

function displayErrorMessage(message: string) {
  const notyf = new Notyf();
  notyf.error({
    message: message,
    duration: 2500,
    position: {
      x: "right",
      y: "bottom",
    },
  });
}
