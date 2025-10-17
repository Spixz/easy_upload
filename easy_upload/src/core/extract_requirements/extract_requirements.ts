import { InputRequirements } from "@/commons/interfaces";
import prompt from "./prompts/medium_prompt.txt?raw";
import {
  Requirements,
} from "@/commons/model_output_schemas/requirements";

// TODO: Prendre en compte la category du fichier pour modifier
// TODO: le prompt d'entrée
// TODO : créer le requirements pour les documents
export class ExtractRequirements {
  static async extract(input: InputRequirements): Promise<Requirements> {
    const session = await LanguageModel.create({
      expectedOutputs: [{ type: "text", languages: ["en"] }],
      initialPrompts: [{ role: "user", content: prompt }],
    });

    const RequirementsType = Requirements.fromFileCategory(input.file_category);
    if (!RequirementsType) {
      throw new Error(
        `No requirements type found for category: ${input.file_category}`,
      );
    }

    const outputSchema = RequirementsType.toRecord();
    const start = Date.now();
    console.log(input.file_category);
    console.log(outputSchema);
    const res = await session.prompt(input.text_for_requirements.join("\n"), {
      responseConstraint: outputSchema,
    });
    const end = Date.now();

    session.destroy();
    console.log(`requirement extraction duration: ${(end - start) / 1000}`);
    return RequirementsType.fromJSON(res);
  }
}
