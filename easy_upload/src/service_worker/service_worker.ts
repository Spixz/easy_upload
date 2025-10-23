import "webext-bridge/background";
import { initSidepanelBridge } from "./sw_sidepanel_bridge";
import {
  ensureOffscreenCreated,
  initOffscreenBridge,
} from "./sw_offscreen_bridge";
import "./service_worker_listener";

console.log("init service worker upload extension");
initSidepanelBridge();
initOffscreenBridge();

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).then(() => {
  ensureOffscreenCreated();
  // sendToOffscreen({ name: "test-imagemagick" });
});
// .catch((error) => console.error(error));
