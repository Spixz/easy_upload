import { InputRequirements } from "@/commons/interfaces";
import { ChromeBridgeMessage } from "@/service_worker/sw_sidepanel_bridge";
import { FileNotifier } from "./notifiers/FileNotifier";
import { MessagesNotifier } from "./notifiers/MessagesNotifier";
import { SystemMessage } from "./messages/messages";

// ! creer une conversation (l'exposer avec l'autre zustand)
// ! lancer la recup des requirements

const port = chrome.runtime.connect({ name: "sidepanel-channel" });
port.onMessage.addListener((msg: ChromeBridgeMessage) => {
  if (msg.name == "input_unprocess_requirements") {
    onInputUnprocessRequirements(msg.data);
  }
});

async function onInputUnprocessRequirements(requirements: InputRequirements) {
  const addMessage = MessagesNotifier.getState().addMessage;

  addMessage(new SystemMessage("Récupération des requirements en cours ..."));
  await FileNotifier.getState().generateRequirements(requirements);
  addMessage(new SystemMessage("Requirements récupérés"));
}
