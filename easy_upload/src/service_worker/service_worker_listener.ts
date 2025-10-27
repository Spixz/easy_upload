import "webext-bridge/background";
import { ensureOffscreenCreated } from "./sw_offscreen_bridge";
import { sendToSidepanel } from "./sw_sidepanel_bridge";
import { onMessage } from "webext-bridge/background";
import { ChromeBridgeMessage } from "@/commons/communications_interfaces";

onMessage("open_sidepanel", async ({ data, sender }) => {
  ensureOffscreenCreated();

  await chrome.sidePanel.open({ tabId: sender.tabId });
  console.log("Side panel opening requested");
  try {
    sendToSidepanel({
      name: "input_unprocess_requirements",
      data: data.raw_requirements,
    } as ChromeBridgeMessage);
  } catch (err) {
    console.error("erreur durant l'envoie des donnes au pannel", err);
  }
});
