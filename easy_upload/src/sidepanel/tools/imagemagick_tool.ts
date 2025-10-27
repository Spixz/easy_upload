import { UserTask } from "@/commons/interfaces";
import {
  MagickCommand,
  MinisearchNotifier,
  searchResultsToCliCommands,
} from "../notifiers/MinisearchNotifier";
import { ToolTask } from "./tool_task";
import { ModelNotifier } from "../model/ModelNotifier";
import selectCommandPrompt from "./prompts/select_command.txt?raw";
import generateCommandPrompt from "./prompts/generate_command.txt?raw";
import { detectFileExt, getFileInOPFS } from "@/commons/helpers/helpers";
import { sidepanelPort } from "../sidepanel_listener";
import {
  ChromeBridgeMessage,
  OffscreenCommandExecutionRequest,
  OffscreenCommandExecutionResult,
} from "@/commons/communications_interfaces";

export default class ImagemagickTool extends ToolTask {
  constructor(userTask: UserTask) {
    super(userTask);
  }

  override async selectCommand(): Promise<void> {
    const { ensureInit } = MinisearchNotifier.getState();
    const notifier = await ensureInit();

    const potentialCommands = notifier.minisearchImagemagick!.search(
      this.goal,
      { fuzzy: 0.4 },
    );
    if (potentialCommands.length == 0) {
      this.initializationSuccess = false;
      return;
    }

    const propositions = searchResultsToCliCommands(potentialCommands).slice(
      0,
      4,
    );
    console.log("les commandes récupérés par minisearch");
    console.log(propositions);
    const propositionsIntents = propositions.map(
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
      const selectedCommand: MagickCommand = propositions[index];
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
      console.error(`l'input file est innexistant ou vide`);
      throw "input file doesn't exist or is empty";
    }

    const fileExtension = (await detectFileExt(inputFile))?.ext;
    var commandExample = this.commandSchema!.example;
    console.log(`exec input file type : [${fileExtension}]`);

    if (
      fileExtension != null &&
      this.commandSchema?.inputType != null &&
      fileExtension in this.commandSchema!.inputType
    ) {
      commandExample = this.commandSchema!.inputType[fileExtension]!;
      console.log(`commande spécifique au type trouvé: ${commandExample}`);
    }

    const promptRequest = {
      "user goal": this.goal,
      "command description": this.commandSchema!.description,
      "command example": commandExample,
    };

    const generatedCommandRes = await ModelNotifier.getState().promptForTask({
      prompt: generateCommandPrompt,
      content: JSON.stringify(promptRequest),
      outputSchema: { command: "string" },
      newSession: true,
    });

    try {
      let generatedCommand: string = Object.values(generatedCommandRes)[0];

      if (fileExtension != null) {
        generatedCommand = generatedCommand.replace(
          " input ",
          ` input.${fileExtension} `,
        );
      }

      console.log(`generated command: ${generatedCommand}`);

      const taskId = crypto.randomUUID();
      sidepanelPort.postMessage({
        name: "exec-command-in-offscreen",
        data: {
          id: taskId,
          inputOPFSFilename: props.inputOPFSFilename,
          outputOPFSFilename: this.outputOPFSFilename,
          command: generatedCommand,
        } as OffscreenCommandExecutionRequest,
      } as ChromeBridgeMessage);

      const offscreenResp = await getOffscreenCommandResult(taskId);
      console.log("Offscreen resp :");
      console.log(offscreenResp);
    } catch (err) {
      throw `The generated command output contain an error : ${JSON.stringify(generatedCommandRes)}`;
    }
  }
}

function getOffscreenCommandResult(
  taskId: string,
): Promise<OffscreenCommandExecutionResult> {
  return new Promise((resolve, _) => {
    const timemoutId = setTimeout(() => {
      console.log(`L'éxécutio de ${taskId} à timeout.`);
      return resolve({
        id: taskId,
        success: false,
      } as OffscreenCommandExecutionResult);
    }, 20000);

    sidepanelPort.onMessage.addListener((message: ChromeBridgeMessage) => {
      if (message.name == "exec-command-in-offscreen-resp") {
        clearTimeout(timemoutId);
        resolve(message.data as OffscreenCommandExecutionResult);
      }
    });
  });
}
