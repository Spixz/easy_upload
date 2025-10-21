const offscreenPort = chrome.runtime.connect({
  name: "offscreen-channel",
});

export default offscreenPort;
