import {
  ChromeBridgeMessage,
  OffscreenCommandExecutionResult,
} from "@/commons/communications_interfaces";
import { sidePanelSWPort } from "../sidepanel_listener";

export function getOffscreenCommandResult(
  taskId: string,
): Promise<OffscreenCommandExecutionResult> {
  return new Promise((resolve, _) => {
    sidePanelSWPort.onMessage.addListener((message: ChromeBridgeMessage) => {
      if (message.name == "exec-command-in-offscreen-resp") {
        resolve(message.data as OffscreenCommandExecutionResult);
      }
    });
  });
}
