import "webext-bridge/background";

import { sendMessage, onMessage } from "webext-bridge/background";

onMessage("open_sidepanel", async ({ data, sender }) => {
  await chrome.sidePanel.open({ tabId: sender.tabId });
  await sendMessage("input_unprocess_requirements", data, `popup@${sender.tabId}`);
});

chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));