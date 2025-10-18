import { ChromeBridgeMessage, InputRequirements } from "@/commons/interfaces";
import { FileNotifier } from "./notifiers/FileNotifier";
import { MessagesNotifier } from "./notifiers/MessagesNotifier";
import { SystemMessage, ThinkingMessage } from "./messages/messages";

const sidepanelPort = chrome.runtime.connect({ name: "sidepanel-channel" });
sidepanelPort.onMessage.addListener(handleWorkerMessage);

async function onInputUnprocessRequirements(requirements: InputRequirements) {
  const addMessage = MessagesNotifier.getState().addMessage;

  addMessage(new SystemMessage("Récupération des requirements en cours ..."));
  try {
    await FileNotifier.getState().generateRequirements(requirements);
    const extractedRequirements = FileNotifier.getState().requirements;
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
