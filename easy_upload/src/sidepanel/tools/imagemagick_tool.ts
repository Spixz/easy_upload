import { UserTask } from "@/commons/interfaces";
import { MinisearchNotifier } from "../notifiers/MinisearchNotifier";
import CommandLineTool from "./command_line_tool";

export default class ImagemagickTool extends CommandLineTool {
  constructor(userTask: UserTask) {
    super({
      userTask: userTask,
      toolName: "imagemagick",
      minisearch: MinisearchNotifier.getState().minisearchImagemagick!,
    });
  }
}
