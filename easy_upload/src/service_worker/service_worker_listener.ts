import "webext-bridge/background";
import { ensureOffscreenCreated } from "./sw_offscreen_bridge";
import { sendToSidepanel } from "./sw_sidepanel_bridge";
import { onMessage } from "webext-bridge/background";
import { ChromeBridgeMessage } from "@/commons/communications_interfaces";

onMessage("open_sidepanel", async ({ data, sender }) => {
  ensureOffscreenCreated();

  console.log(chrome.storage.session);
  chrome.storage.session.set({
    sidePanelOpenReason: "CONTENT_SCRIPT_REQUEST",
  });
  await chrome.sidePanel.open({ tabId: sender.tabId });
});

onMessage("input_unprocess_requirements", async ({ data, sender }) => {
  sendToSidepanel({
    name: "input_unprocess_requirements",
    data: data.raw_requirements,
  } as ChromeBridgeMessage);
});
