import { UserTask } from "@/commons/interfaces";
import {
  BasicCliCommand,
  MagickCommand,
  MinisearchNotifier,
  searchResultsToCliCommands,
} from "../notifiers/MinisearchNotifier";
import { ToolTask } from "./tool_task";
import { ModelNotifier } from "../model/ModelNotifier";
import selectCommandPrompt from "./prompts/select_command.txt?raw";
import generateCommandPrompt from "./prompts/generate_command.txt?raw";
import { detectFileExt, getFileInOPFS } from "@/commons/helpers";

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

    const proposition = searchResultsToCliCommands(potentialCommands).slice(
      0,
      3,
    );
    const propositionsIntents = proposition.map(
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
      const selectedCommand: MagickCommand = proposition[index];
      console.log(selectedCommand);
      this.commandSchema = selectedCommand;
      this.initializationSuccess = true;
    } catch (err) {
      console.error(`Error during tool search for intent : ${this.goal}`);
      this.initializationSuccess = false;
    }
  }

  override async exec(props: {
    inputFilename: string;
    outputFilename: string;
  }): Promise<void> {
    const inputFile = await getFileInOPFS(props.inputFilename);
    if (inputFile == null) {
      console.error(`l'input file est innexistant ou vide`);
      throw "input file doesn't exist or is empty";
    }

    const fileType = await detectFileExt(inputFile);
    var commandExample = this.commandSchema!.example;
    console.log(fileType);

    if (
      fileType != null &&
      this.commandSchema?.inputType != null &&
      fileType in this.commandSchema!.inputType
    ) {
      commandExample = this.commandSchema!.inputType[fileType]!;
      console.log(`commande spécifique au type trouvé ${commandExample}`);
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
      const generatedCommand: string = Object.values(generatedCommandRes)[0];

      console.log("generated command");
      console.log(generatedCommand);

      if (fileType != null) {
        generatedCommand.replace(" input ", `input${fileType}`);
      }

      console.log(`generated command with file type ${generatedCommand}`);
    } catch (err) {
      console.warn(
        `The generated command output contain an error : ${JSON.stringify(generatedCommandRes)}`,
      );
    }
    // j'ai bien le format du fichier maintent faire ma tambouille
    // pour modifier le nom de l'output.
    // en gros si

    // si flemme de marquer la commande, pour l'instant,
    // mettre dans public le fichier et le mettre dans opfs au clic sur le bouton
  }
}
