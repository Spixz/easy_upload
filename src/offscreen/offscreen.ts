import offscreenPort from "./offscreen_port";
import { executeMagiskCommand } from "./imagemagick";
import {
  ChromeBridgeMessage,
  OffscreenCommandExecutionRequest,
} from "@/commons/communications_interfaces";
import { executeFmmpegCommand } from "./ffmpeg";

offscreenPort.onMessage.addListener(async (msg: ChromeBridgeMessage) => {
  console.log("[Offscreen] ← Message du SW :");
  console.log("message recu");
  console.log(msg);

  switch (msg.name) {
    case "exec-command-in-offscreen":
      const request: OffscreenCommandExecutionRequest = msg.data;
      console.log("demance de commande recu par le offscreeen !");
      if (request.tool == "imagemagick") {
        await executeMagiskCommand(request);
      } else if (request.tool == "ffmpeg") {
        await executeFmmpegCommand(request);
      }
      break;

    default:
      console.warn("[Offscreen] Message inconnu :", msg);
  }
});