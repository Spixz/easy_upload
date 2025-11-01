import { OffscreenCommandExecutionResult } from "@/commons/communications_interfaces";
import offscreenPort from "./offscreen_port";

export function sendExecCommandResponse(id: string, success: boolean) {
  offscreenPort.postMessage({
    name: "exec-command-in-offscreen-resp",
    data: {
      id: id,
      success: success,
    } as OffscreenCommandExecutionResult,
  });
}
