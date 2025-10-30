import { UserTask } from "@/commons/interfaces";
import { ToolTask } from "./tool_task";
import selectTabPrompt from "./prompts/select_ui_image_tab_prompt.txt?raw";
import { getFileInOPFS } from "@/commons/helpers/helpers";
import openImageEditor from "@/image_ui_editor/open_ui_editor";
import { ModelNotifier } from "../model/ModelNotifier";
import { sidePanelSWPort } from "../sidepanel_listener";
import {
  ChromeBridgeMessage,
  UiImageEditorClosingMessage,
} from "@/commons/communications_interfaces";

export default class UiImageEditorTool extends ToolTask {
  toolName: string = "ui_image_editor";
  initialTab: string | undefined;

  constructor(userTask: UserTask) {
    super(userTask);
  }

  override async initialize(): Promise<void> {
    const resp = await ModelNotifier.getState().promptForTask({
      prompt: selectTabPrompt,
      content: `input: ${this.goal}`,
      outputSchema: { tool: "string" },
      newSession: true,
    });

    this.initialTab =
      Object.keys(resp).length != 0 &&
      typeof Object.values(resp)[0] === "string"
        ? Object.values(resp)[0]
        : "Adjust";
    this.initializationSuccess = true;
  }

  override async exec(props: { inputOPFSFilename: string }): Promise<void> {
    const inputFile = await getFileInOPFS(props.inputOPFSFilename);
    if (inputFile == null) {
      console.error(`[tool.exec] the file to work on is not found.`);
      throw "input file doesn't exist or is empty";
    }

    const windowId = await openImageEditor({
      origin: "task",
      opfsInputFilename: props.inputOPFSFilename,
      opfsOutputFilename: this.outputOPFSFilename,
      initialTab: this.initialTab,
    });

    const success = await waitWindowClosing(windowId);
    if (!success) {
      throw "The image editing window was closed without modifications done.";
    }
  }
}

function waitWindowClosing(windowId: number): Promise<boolean> {
  return new Promise((resolve, _) => {
    sidePanelSWPort.onMessage.addListener((message: ChromeBridgeMessage) => {
      if (message.name == "ui_image_editor_closed") {
        const data: UiImageEditorClosingMessage = message.data;
        if (data.origin == "task") {
          resolve(true);
        }
      }
    });
    sidePanelSWPort.onMessage.addListener((message: ChromeBridgeMessage) => {
      if (message.name == "window_closed") {
        if (message.data.id == windowId) {
          resolve(false);
        }
      }
    });
  });
}
