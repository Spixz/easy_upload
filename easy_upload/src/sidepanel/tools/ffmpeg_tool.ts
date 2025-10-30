import { UserTask } from "@/commons/interfaces";
import { MinisearchNotifier } from "../notifiers/MinisearchNotifier";
import CommandLineTool from "./command_line_tool";

export default class FfmpegTool extends CommandLineTool {
  toolName: string = "ffmpeg";

  constructor(userTask: UserTask) {
    super({
      userTask: userTask,
      minisearch: MinisearchNotifier.getState().minisearchFfmpeg!,
    });
  }
}
