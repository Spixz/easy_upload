import { FileCategory } from "@/commons/enums";
import { InputRequirements } from "@/commons/interfaces";
import { Requirements } from "@/commons/model_output_schemas/requirements";
import { ExtractRequirements } from "@/core/extract_requirements/extract_requirements";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ConversationNotifier } from "../conversation/ConversationNotifier";
import { sidepanelPort } from "../sidepanel_listener";
import { ChromeBridgeMessage } from "@/commons/communications_interfaces";

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
      sidepanelPort.postMessage({
        name: "inject-file",
        data: filename,
      } as ChromeBridgeMessage);
    },
  })),
);
