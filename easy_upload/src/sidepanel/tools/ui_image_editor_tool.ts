import { UserTask } from "@/commons/interfaces";
import { ToolTask } from "./tool_task";
import selectTabPrompt from "./prompts/select_ui_image_tab_prompt.txt?raw";
import { getFileInOPFS } from "@/commons/helpers/helpers";
import openImageEditor from "@/image_ui_editor/open_ui_editor";
import { ModelNotifier } from "../model/ModelNotifier";

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

    // const fileExtension = (await detectFileExt(inputFile))?.ext;
    // var commandExample = this.commandSchema!.example;
    // console.log(`[tool.exec] input file format ${fileExtension}`);

    // if (
    //   fileExtension != null &&
    //   this.commandSchema?.inputType != null &&
    //   fileExtension in this.commandSchema!.inputType
    // ) {
    //   commandExample = this.commandSchema!.inputType[fileExtension]!;
    //   console.log(`[tool.exec] special command found for this filetype`);
    // }

    openImageEditor(props.inputOPFSFilename, this.initialTab);
    // ! listener fermeture
    // ! juste throw une erreur pour dire pas foire
  }
}
