import "webext-bridge/background";
import { initSidepanelBridge } from "./sw_sidepanel_bridge";
import {
  ensureOffscreenCreated,
  initOffscreenBridge,
} from "./sw_offscreen_bridge";
import "./service_worker_listener";
import { initContentScriptBridge } from "./sw_content_script_bridge";

console.log("init service worker upload extension");
initContentScriptBridge();
initSidepanelBridge();
initOffscreenBridge();

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).then(() => {
  ensureOffscreenCreated();
});
