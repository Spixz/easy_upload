import { UserTask } from "@/commons/interfaces";
import { BasicCliCommand } from "../notifiers/MinisearchNotifier";

type TaskStatus = "pending" | "inProgress" | "done" | "error";

export abstract class ToolTask {
  id: string = crypto.randomUUID();
  goal: string;
  status: TaskStatus;
  initializationSuccess: boolean;
  outputOPFSFilename: string = crypto.randomUUID();
  commandToExecute?: string;
  commandSchema?: BasicCliCommand;
  resultPath?: string;

  constructor(userTask: UserTask) {
    this.goal = userTask.i_want;
    this.status = "pending";
    this.initializationSuccess = false;
  }

  static async factory(userTask: UserTask): Promise<ToolTask | undefined> {
    switch (userTask.tool_name) {
      case "imagemagick": {
        const { default: ImagemagickTool } = await import("./imagemagick_tool");
        const tool = new ImagemagickTool(userTask);

        await tool.selectCommand();
        if (tool.initializationSuccess) return tool;
      }
    }
  }

  set setStatus(status: TaskStatus) {
    this.status = status;
  }

  abstract selectCommand(): Promise<void>; // peut etre null par exemple pour imageCutter
  // quio que, est ce que je donnerai pas aussi une db et créerai pas des commmandes
  // pour lui pour configurer l'interface
  abstract exec(props: {
    inputOPFSFilename: string;
  }): Promise<void>;
  // lance la tache.
  // par ex pour imageCutter envoi un message qui ouvre une fenetre. Par contre
  /// il faut qu'il puisse savoir quand la tache est terminée.
  /// dans son cas, il lui faudrai un listener qui ecoute un message specifique du content script
  // ou sinon juste expose une foncton qui pourra etre appeler justement par ce listener
  // et changer le status de la tache.
}
