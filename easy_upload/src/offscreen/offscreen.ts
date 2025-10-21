import { ChromeBridgeMessage } from "@/commons/interfaces";
import offscreenPort from "./offscreen_port";
import { ensureFFmpeg, ffmpegConvert } from "./ffmpeg";
import { basicManip } from "./imagemagick";

offscreenPort.onMessage.addListener(async (msg: ChromeBridgeMessage) => {
  console.log("[Offscreen] ← Message du SW :", msg);
  console.log("message recu");
  console.log(msg);

  switch (msg.name) {
    case "ping-from-sidepanel":
      offscreenPort.postMessage({
        name: "pong",
        data: "👋 Hello depuis Offscreen",
      });
      break;

    case "convert-video":
      await ensureFFmpeg();
      console.log("[Offscreen] ffmpeg prêt, conversion...");
      await ffmpegConvert(msg.data);
      break;

    case "convert-image":
      // await ensureMagick();
      console.log("[Offscreen] imagemagick prêt, conversion...");
      // await magickConvert(msg.data);
      break;

    case "test-imagemagick":
      console.log("offscreen : message recu pour manip fichier imagemagick");
      basicManip();
      break;

    default:
      console.warn("[Offscreen] Message inconnu :", msg);
  }
});
