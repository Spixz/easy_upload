import { UserTask } from "@/commons/interfaces";
import { MinisearchNotifier } from "../notifiers/MinisearchNotifier";
import CommandLineTool from "./command_line_tool";

export default class FfmpegTool extends CommandLineTool {
  constructor(userTask: UserTask) {
    super({
      userTask: userTask,
      toolName: "ffmpeg",
      minisearch: MinisearchNotifier.getState().minisearchFfmpeg!,
    });
  }
}
