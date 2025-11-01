import { UserTask } from "@/commons/interfaces";
import {
  BasicCliCommand,
  MinisearchNotifier,
} from "../notifiers/MinisearchNotifier";
import { generateRandomString } from "@/commons/helpers/helpers";

export type TaskStatus = "pending" | "inProgress" | "done" | "error";

export abstract class ToolTask {
  id: string = generateRandomString();
  goal: string;
  status: TaskStatus;
  initializationSuccess: boolean;
  outputOPFSFilename: string = generateRandomString();
  commandToExecute?: string;
  commandSchema?: BasicCliCommand;
  resultPath?: string;
  abstract toolName: string;

  constructor(userTask: UserTask) {
    this.goal = userTask.i_want;
    this.status = "pending";
    this.initializationSuccess = false;
  }

  static async factory(userTask: UserTask): Promise<ToolTask | undefined> {
    await MinisearchNotifier.getState().ensureInit();

    switch (userTask.tool_name) {
      case "imagemagick": {
        const { default: ImagemagickTool } = await import("./imagemagick_tool");
        const tool = new ImagemagickTool(userTask);

        await tool.initialize();
        if (tool.initializationSuccess) return tool;
        break;
      }
      case "ffmpeg": {
        const { default: FfmpegTool } = await import("./ffmpeg_tool");
        const tool = new FfmpegTool(userTask);

        await tool.initialize();
        if (tool.initializationSuccess) return tool;
        break;
      }
      case "ui_image_editor": {
        const { default: UiImageEditorTool } = await import(
          "./ui_image_editor_tool"
        );
        const tool = new UiImageEditorTool(userTask);

        await tool.initialize();
        if (tool.initializationSuccess) return tool;
        break;
      }
    }
  }

  set setStatus(status: TaskStatus) {
    this.status = status;
  }

  abstract initialize(): Promise<void>;
  abstract exec(props: { inputOPFSFilename: string }): Promise<void>;

  copyWith(props: Partial<Omit<ToolTask, "id">>): ToolTask {
    const newObject = { ...this, ...props };
    Object.setPrototypeOf(newObject, Object.getPrototypeOf(this));
    return newObject as ToolTask;
  }
}
