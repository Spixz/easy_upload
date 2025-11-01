import { ToolName } from "./interfaces";

export interface ChromeBridgeMessage {
  name: string;
  data: any;
}

export interface OffscreenCommandExecutionRequest {
  id: string;
  tool: ToolName;
  inputOPFSFilename: string;
  outputOPFSFilename: string;
  command: string;
}

export interface OffscreenCommandExecutionResult {
  id: string;
  success: boolean;
}

export interface UiImageEditorClosingMessage {
  origin: "task" | "edit";
  success: boolean;
  outputFilenameInOPFS?: string;
}
