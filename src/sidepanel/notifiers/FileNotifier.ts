import { FileCategory } from "@/commons/enums";
import { InputRequirements } from "@/commons/interfaces";
import { Requirements } from "@/commons/model_output_schemas/requirements";
import { ExtractRequirements } from "@/core/extract_requirements/extract_requirements";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ConversationNotifier } from "../conversation/ConversationNotifier";
import { getFileInOPFS } from "@/commons/helpers/helpers";
import { sendChunkedMessage } from "@/vendors/ext-send-chuncked-message";
import { contentScriptPort } from "../bridges/sidepanel_content_script_bridge";

export interface UserFileState {
  textForRequirements: string[];
  fileCategory: FileCategory;
  requirements: Requirements;
  generateRequirements: (inputRequirements: InputRequirements) => Promise<void>;
  injectFileInContentScript: (filename: string) => void;
}

export const UserFileNotifier = create<UserFileState>()(
  devtools((set, get) => ({
    async generateRequirements(inputRequirements: InputRequirements) {
      set((_) => ({
        textForRequirements: inputRequirements.text_for_requirements,
        fileCategory: inputRequirements.file_category,
      }));

      ConversationNotifier.getState().enableUserInput(false);
      const requirements = await ExtractRequirements.extract(inputRequirements);
      console.log("generated requirements:");
      console.log(requirements);
      ConversationNotifier.getState().enableUserInput(true);

      set((_) => ({
        requirements: requirements,
      }));
    },
    async injectFileInContentScript(filename: string) {
      const file = await getFileInOPFS(filename);
      if (file == null) {
        console.warn("sw: file not found for injection");
        return;
      }

      const buff: ArrayBuffer = await file.arrayBuffer();
      sendChunkedMessage(
        {
          type: "inject-file",
          data: Array.from(new Uint8Array(buff)),
        },
        { port: contentScriptPort! },
      );
    },
  })),
);
