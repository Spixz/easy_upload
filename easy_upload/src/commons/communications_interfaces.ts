export interface ChromeBridgeMessage {
  name: string;
  data: any;
}

export interface OffscreenCommandExecutionRequest {
  id: string;
  inputOPFSFilename: string;
  outputOPFSFilename: string;
  command: string;
}

export interface OffscreenCommandExecutionResult {
  id: string;
  success: boolean;
}
