import { FileCategory } from "@/commons/enums";
import { InputRequirements } from "@/commons/interfaces";
import { Requirements } from "@/commons/model_output_schemas/requirements";
import { ExtractRequirements } from "@/core/extract_requirements/extract_requirements";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ConversationNotifier } from "../conversation/ConversationNotifier";

export interface UserFileState {
  textForRequirements: string[];
  fileCategory: FileCategory;
  requirements: Requirements;
  inputFileIsEmpty: boolean;
  generateRequirements: (inputRequirements: InputRequirements) => Promise<void>;
  updateUserFileIsEmpty: (isEmpty: boolean) => void;
}

export const UserFileNotifier = create<UserFileState>()(
  devtools((set, get) => ({
    inputFileIsEmpty: true,
    async generateRequirements(inputRequirements: InputRequirements) {
      set((_) => ({
        textForRequirements: inputRequirements.text_for_requirements,
        fileCategory: inputRequirements.file_category,
      }));

      ConversationNotifier.getState().enableUserInput(false);
      const requirements = await ExtractRequirements.extract(inputRequirements);
      console.log(requirements);
      ConversationNotifier.getState().enableUserInput(true);

      set((_) => ({
        requirements: requirements,
      }));
    },
    updateUserFileIsEmpty(isEmpty: boolean) {
      set((_) => ({ inputFileIsEmpty: isEmpty }));
    },
  })),
);
