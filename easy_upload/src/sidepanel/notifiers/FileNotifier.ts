import { FileCategory } from "@/commons/enums";
import { InputRequirements } from "@/commons/interfaces";
import { Requirements } from "@/commons/model_output_schemas/requirements";
import { ExtractRequirements } from "@/core/extract_requirements/extract_requirements";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface UserFileState {
  text_for_requirements: string[];
  file_category: FileCategory;
  requirements: Requirements;
  generateRequirements: (inputRequirements: InputRequirements) => Promise<void>;
}

export const UserFileNotifier = create<UserFileState>()(
  devtools((set, get) => ({
    async generateRequirements(inputRequirements: InputRequirements) {
      set((_) => ({
        text_for_requirements: inputRequirements.text_for_requirements,
        file_category: inputRequirements.file_category,
      }));

      const requirements = await ExtractRequirements.extract(inputRequirements);
      console.log(requirements);

      set((_) => ({
        requirements: requirements,
      }));
    },
  })),
);
