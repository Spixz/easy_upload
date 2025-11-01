import { UserTask } from "@/commons/interfaces";
import { MinisearchNotifier } from "../notifiers/MinisearchNotifier";
import CommandLineTool from "./command_line_tool";

export default class ImagemagickTool extends CommandLineTool {
  toolName: string = "imagemagick";

  constructor(userTask: UserTask) {
    super({
      userTask: userTask,
      minisearch: MinisearchNotifier.getState().minisearchImagemagick!,
    });
  }
}
