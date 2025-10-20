import { ChromeBridgeMessage, InputRequirements } from "@/commons/interfaces";
import { UserFileNotifier } from "./notifiers/FileNotifier";
import { ConversationNotifier } from "./conversation/ConversationNotifier";
import {
  SystemMessage,
  ThinkingMessage,
} from "./conversation/messages/messages";

const sidepanelPort = chrome.runtime.connect({ name: "sidepanel-channel" });
sidepanelPort.onMessage.addListener(handleWorkerMessage);

async function onInputUnprocessRequirements(requirements: InputRequirements) {
  const { addMessage } = ConversationNotifier();

  addMessage(new SystemMessage("Récupération des requirements en cours ..."));
  try {
    await UserFileNotifier.getState().generateRequirements(requirements);
    const extractedRequirements = UserFileNotifier.getState().requirements;
    addMessage(new SystemMessage("Requirements récupérés"));
    addMessage(
      new ThinkingMessage(
        "Requiements",
        "start",
        extractedRequirements.toString(),
      ),
    );
  } catch {
    addMessage(
      new SystemMessage(
        "Une erreur s'est produite durant la récupération des requirements",
      ),
    );
  }
}

function handleWorkerMessage(message: ChromeBridgeMessage) {
  switch (message.name) {
    case "input_unprocess_requirements":
      onInputUnprocessRequirements(message.data);
      break;
    default:
      console.warn("[SidepanelListener] Message inconnu :", message);
  }
}
