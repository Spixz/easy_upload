import "webext-bridge/background";
import { onMessage } from "webext-bridge/background";
import { initSidepanelBridge, sendToSidepanel } from "./sw_sidepanel_bridge";
import {
  ensureOffscreenCreated,
  initOffscreenBridge,
  sendToOffscreen,
} from "./sw_offscreen_bridge";
import { ChromeBridgeMessage } from "@/commons/interfaces";

console.log("init service worker upload extension");
initSidepanelBridge();
initOffscreenBridge();

onMessage("open_sidepanel", async ({ data, sender }) => {
  ensureOffscreenCreated();
  sendToOffscreen({ name: "test-imagemagick" });
  await chrome.sidePanel.open({ tabId: sender.tabId });
  console.log("Ouveture tu side panel demandé");
  try {
    console.log("Envoie des donne vers le pannel");
    sendToSidepanel({
      name: "input_unprocess_requirements",
      data: data.raw_requirements,
    } as ChromeBridgeMessage);
  } catch (err) {
    console.error("erreur durant l'envoie des donnes au pannel", err);
  }
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).then(() => {
  ensureOffscreenCreated();
});
// .catch((error) => console.error(error));
