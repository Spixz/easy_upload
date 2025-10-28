import {
  ChromeBridgeMessage,
  OffscreenCommandExecutionResult,
} from "@/commons/communications_interfaces";
import { sidepanelPort } from "../sidepanel_listener";

export function getOffscreenCommandResult(
  taskId: string,
): Promise<OffscreenCommandExecutionResult> {
  return new Promise((resolve, _) => {
    // const timemoutId = setTimeout(() => {
    //   console.log(`L'éxécutio de ${taskId} à timeout.`);
    //   return resolve({
    //     id: taskId,
    //     success: false,
    //   } as OffscreenCommandExecutionResult);
    // }, 20000);

    sidepanelPort.onMessage.addListener((message: ChromeBridgeMessage) => {
      if (message.name == "exec-command-in-offscreen-resp") {
        // clearTimeout(timemoutId);
        resolve(message.data as OffscreenCommandExecutionResult);
      }
    });
  });
}
