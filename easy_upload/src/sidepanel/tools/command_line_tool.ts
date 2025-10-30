import { TOOL_NAMES, UserTask } from "@/commons/interfaces";
import {
  BasicCliCommand,
  searchResultsToCliCommands,
} from "../notifiers/MinisearchNotifier";
import { ToolTask } from "./tool_task";
import { ModelNotifier } from "../model/ModelNotifier";
import selectCommandPrompt from "./prompts/select_command_prompt.txt?raw";
import generateCommandPrompt from "./prompts/generate_command_prompt.txt?raw";
import {
  detectFileExt,
  generateRandomString,
  getFileInOPFS,
} from "@/commons/helpers/helpers";
import { sidepanelPort } from "../sidepanel_listener";
import {
  ChromeBridgeMessage,
  OffscreenCommandExecutionRequest,
} from "@/commons/communications_interfaces";
import { getOffscreenCommandResult } from "./get_offscreen_result";
import MiniSearch from "minisearch";

export default abstract class CommandLineTool extends ToolTask {
  minisearch: MiniSearch<BasicCliCommand>;
  abstract toolName: string;

  constructor({
    userTask,
    minisearch,
  }: {
    userTask: UserTask;
    minisearch: MiniSearch<BasicCliCommand>;
  }) {
    super(userTask);
    this.minisearch = minisearch;
  }

  // generate the command
  override async initialize(): Promise<void> {
    const potentialCommands = this.minisearch.search(this.goal, {
      fuzzy: 0.4,
    });
    if (potentialCommands.length == 0) {
      this.initializationSuccess = false;
      return;
    }

    const bestCommands = searchResultsToCliCommands(potentialCommands).slice(
      0,
      4,
    );
    console.log(
      `Potentials commands found by minisearch to satisfy the task "${this.goal}" with the tool "${this.toolName}"`,
    );
    console.log(bestCommands);
    const propositionsIntents = bestCommands.map(
      (command, index) => `${index} - ${command.intent}`,
    );
    const content = `user intents: ${this.goal}\ntool proposal:\n${propositionsIntents.join("\n")} `;
    const toolIndex = await ModelNotifier.getState().promptForTask({
      prompt: selectCommandPrompt,
      content: content,
      outputSchema: { tool_number: "number" },
      newSession: true,
    });

    try {
      const index = Number(Object.values(toolIndex)[0]);
      const selectedCommand: BasicCliCommand = bestCommands[index];
      console.log("Command selected:");
      console.log(selectedCommand);
      this.commandSchema = selectedCommand;
      this.initializationSuccess = true;
    } catch (err) {
      console.error(`Error during tool search for intent : ${this.goal}`);
      this.initializationSuccess = false;
    }
  }

  override async exec(props: { inputOPFSFilename: string }): Promise<void> {
    const inputFile = await getFileInOPFS(props.inputOPFSFilename);
    if (inputFile == null) {
      console.error(`[tool.exec] the file to work on is not found.`);
      throw "input file doesn't exist or is empty";
    }

    const fileExtension = (await detectFileExt(inputFile))?.ext;
    var commandExample = this.commandSchema!.example;
    console.log(`[tool.exec] input file format ${fileExtension}`);

    if (
      fileExtension != null &&
      this.commandSchema?.inputType != null &&
      fileExtension in this.commandSchema!.inputType
    ) {
      commandExample = this.commandSchema!.inputType[fileExtension]!;
      console.log(`[tool.exec] special command found for this filetype`);
    }

    const generatedCommandRes = await ModelNotifier.getState().promptForTask({
      prompt: generateCommandPrompt,
      content: JSON.stringify({
        "user goal": this.goal,
        "command description": this.commandSchema!.description,
        "command example": commandExample,
      }),
      outputSchema: { command: "string" },
      newSession: true,
    });

    let generatedCommand: string = Object.values(generatedCommandRes)[0];
    generatedCommand = TOOL_NAMES.reduce(
      (s, w) => s.replaceAll(w, ""),
      generatedCommand,
    );

    if (fileExtension != null) {
      generatedCommand = generatedCommand.replace(
        " input ",
        ` input.${fileExtension} `,
      );
    }

    console.log(`[tool.exec] generated command: ${generatedCommand}`);

    const taskId = generateRandomString();
    sidepanelPort.postMessage({
      name: "exec-command-in-offscreen",
      data: {
        id: taskId,
        tool: this.toolName,
        inputOPFSFilename: props.inputOPFSFilename,
        outputOPFSFilename: this.outputOPFSFilename,
        command: generatedCommand,
      } as OffscreenCommandExecutionRequest,
    } as ChromeBridgeMessage);

    const offscreenResp = await getOffscreenCommandResult(taskId);
    console.log("[tool.exec] Offscreen response");
    console.log(offscreenResp);
    if (!offscreenResp.success) {
      throw "error duting the execution of the worker in the window of the task or timeout";
    }
  }
}
