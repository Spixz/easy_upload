import offscreenPort from "./offscreen_port";
import { ensureFFmpeg, ffmpegConvert } from "./ffmpeg";
import { executeMagiskCommand } from "./imagemagick";
import {
  ChromeBridgeMessage,
  OffscreenCommandExecutionRequest,
} from "@/commons/communications_interfaces";

offscreenPort.onMessage.addListener(async (msg: ChromeBridgeMessage) => {
  console.log("[Offscreen] ← Message du SW :", msg);
  console.log("message recu");
  console.log(msg);

  switch (msg.name) {
    case "convert-video":
      await ensureFFmpeg();
      console.log("[Offscreen] ffmpeg prêt, conversion...");
      await ffmpegConvert(msg.data);
      break;

    case "exec-command-in-offscreen":
      console.log("demance de commande recu par le offscreeen !");
      await executeMagiskCommand(msg.data as OffscreenCommandExecutionRequest);
      break;

    default:
      console.warn("[Offscreen] Message inconnu :", msg);
  }
});
