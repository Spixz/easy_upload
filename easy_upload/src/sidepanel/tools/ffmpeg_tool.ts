import { UserTask } from "@/commons/interfaces";
import {
  FfmpegCommand,
  MinisearchNotifier,
  searchResultsToCliCommands,
} from "../notifiers/MinisearchNotifier";
import { ToolTask } from "./tool_task";
import { ModelNotifier } from "../model/ModelNotifier";
import selectCommandPrompt from "./prompts/select_command.txt?raw";

export default class FfmpegTool extends ToolTask {
  commandSchema?: FfmpegCommand;
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
      const selectedCommand = proposition[index];
      console.log(selectedCommand);
      this.commandSchema = selectedCommand;
      this.initializationSuccess = true;
    } catch (err) {
      console.error(`Error during tool search for intent : ${this.goal}`);
      this.initializationSuccess = false;
    }
  }

  override async exec(): Promise<void> {
    const userFile = 
  }
}
