import { InputRequirements } from "@/commons/interfaces";
import { UserFileNotifier } from "./notifiers/FileNotifier";
import { ConversationNotifier } from "./conversation/ConversationNotifier";
import {
  SystemMessage,
  ThinkingMessage,
} from "./conversation/messages/messages";
import { addOnChunkedMessageListener } from "ext-send-chunked-message";
import { userInputFilenameInOPFS } from "@/commons/const";
import { ChromeBridgeMessage } from "@/commons/communications_interfaces";

export const sidepanelPort = chrome.runtime.connect({
  name: "sidepanel-channel",
});

sidepanelPort.onMessage.addListener(handleWorkerMessage);

function handleWorkerMessage(message: ChromeBridgeMessage) {
  console.log("message recu par le sidepannel", message);
  switch (message.name) {
    case "input_unprocess_requirements":
      onInputUnprocessRequirements(message.data);
      break;
    case "exec-command-in-offscreen-resp":
      break;
    default:
      console.warn("[SidepanelListener] Message inconnu :", message);
  }
}

async function onInputUnprocessRequirements(requirements: InputRequirements) {
  const { addMessage } = ConversationNotifier.getState();

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
    addMessage(
      new SystemMessage("An error occurred while fetching the requirements."),
    );
  }
}

addOnChunkedMessageListener(
  async (message: any, sender: any, sendResponse: any) => {
    console.log("sidpanel 📩 Message reçu de", sender);
    console.log("📦 Données reçues:", message);

    if (message?.type != "user input file changed") {
      return;
    }

    const bytes = new Uint8Array(message.data);
    if (bytes.length == 0) {
      UserFileNotifier.getState().updateUserFileIsEmpty(false);
      console.log(
        "Le fichier (user file input) recu par le sidepannel est vide.",
      );
      return;
    }

    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle(userInputFilenameInOPFS, {
      create: true,
    });
    const writable = await fileHandle.createWritable();

    await writable.write(bytes);
    await writable.close();

    console.log("✅ Fin de l'écriture du fichier");

    //   // 🧠 Vérification : relis le fichier pour confirmer sa taille
    //   const savedHandle = await root.getFileHandle("user_input_file");
    //   const savedFile = await savedHandle.getFile();

    //   console.log("📏 Taille sauvegardée :", savedFile.size, "octets");

    //   if (savedFile.size === bytes.byteLength) {
    //     console.log("✅ Vérification réussie : tailles identiques !");
    //   } else {
    //     console.warn(
    //       "⚠️ Taille différente ! attendu:",
    //       bytes.byteLength,
    //       "obtenu:",
    //       savedFile.size
    //     );
    //   }
  },
);
