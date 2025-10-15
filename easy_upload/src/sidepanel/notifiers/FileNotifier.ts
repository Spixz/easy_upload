import { FileCategory } from "@/commons/enums";
import { InputRequirements } from "@/commons/interfaces";
import { ExtractRequirements } from "@/core/extract_requirements/extract_requirements";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface FileState {
  text_for_requirements: string[];
  file_category: FileCategory;
  requirements: string;
  generateRequirements: (inputRequirements: InputRequirements) => Promise<void>;
}

export const FileNotifier = create<FileState>()(
  devtools((set, get) => ({
    async generateRequirements(inputRequirements: InputRequirements) {
      set((_) => ({
        text_for_requirements: inputRequirements.text_for_requirements,
        file_category: inputRequirements.file_category,
      }));

      const requirements: string =
        await ExtractRequirements.extract(inputRequirements);
      console.log(requirements);

      try {
        set((_) => ({
          requirements: requirements,
        }));
      } catch (err) {
        console.error(err);
      }
    },
  })),
);
