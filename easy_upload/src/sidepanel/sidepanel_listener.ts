import { InputRequirements } from "@/commons/interfaces";
import { UserFileNotifier } from "./notifiers/FileNotifier";
import { ConversationNotifier } from "./conversation/ConversationNotifier";
import {
  SystemMessage,
  ThinkingMessage,
} from "./conversation/messages/messages";
import {
  ChromeBridgeMessage,
  UiImageEditorClosingMessage,
} from "@/commons/communications_interfaces";
import { addOnChunkedMessageListener } from "@/vendors/ext-send-chuncked-message";
import UserFileMessage from "./conversation/messages/user_file_message";
import { generateRandomString } from "@/commons/helpers/helpers";
import { TasksSessionManagerNotifier } from "./tools/tasks_session_manager";

export const sidePanelSWPort = chrome.runtime.connect({
  name: "sidepanel-channel",
});

sidePanelSWPort.onMessage.addListener(handleSWMessages);

function handleSWMessages(message: ChromeBridgeMessage) {
  console.log("message du SW recu par le sidepannel", message);
  switch (message.name) {
    case "input_unprocess_requirements": {
      onInputUnprocessRequirements(message.data);
      break;
    }
    case "ui_image_editor_closed": {
      onUiImageEditorWindowClosed(message.data);
      break;
    }
    default:
      console.warn("[SidepanelListener] Message inconnu :", message);
  }
}

async function onInputUnprocessRequirements(requirements: InputRequirements) {
  const { addMessage, enableUserInput } = ConversationNotifier.getState();

  addMessage(new SystemMessage("Retrieving file requirements..."));
  try {
    await UserFileNotifier.getState().generateRequirements(requirements);
    const extractedRequirements = UserFileNotifier.getState().requirements;
    addMessage(new SystemMessage("Requirements retrieved"));
    addMessage(
      new ThinkingMessage(
        "Website file requirements",
        "start",
        extractedRequirements.toString(),
      ),
    );
  } catch {
    enableUserInput(true);
    addMessage(
      new SystemMessage("An error occurred while fetching the requirements."),
    );
  }
}

function onUiImageEditorWindowClosed(message: UiImageEditorClosingMessage) {
  const { addMessage, enableUserInput } = ConversationNotifier.getState();

  if (message.origin == "task") return;
  if (message.success) {
    if (message.outputFilenameInOPFS != null) {
      addMessage(
        new UserFileMessage({
          title: "Manually Edited Image",
          opfsFilename: message.outputFilenameInOPFS,
          showInjectButton: true,
        }),
      );
      TasksSessionManagerNotifier.getState().setFileToWorkOn(
        message.outputFilenameInOPFS,
      );
    }
  } else {
    addMessage(new SystemMessage("An error occurred during the image editing"));
  }

  enableUserInput(true);
}

addOnChunkedMessageListener(
  (message: any, sender: any, sendResponse: any) => {
    if (message?.type != "user_input_file_changed") {
      return;
    }
    handleFileReception(message);
  },
  { channel: "cc-to-panel" },
);

async function handleFileReception(message: any) {
  const bytes = new Uint8Array(message.data);
  if (bytes.length == 0) {
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
