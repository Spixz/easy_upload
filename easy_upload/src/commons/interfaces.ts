import { FileCategory } from "./enums";

export interface InputRequirements {
    text_for_requirements: string[],
    file_category: FileCategory
}


export interface UserTask {
  tool_name: string;
  i_want: string;
}


export const TOOL_NAMES = ["imageCutter", "imagemagick", "ffmpeg"] as const;
export type ToolName = typeof TOOL_NAMES[number];