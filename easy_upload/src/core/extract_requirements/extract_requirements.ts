import { InputRequirements } from "@/commons/interfaces";
import prompt from "./prompts/medium_prompt.txt?raw";
import output_schema_image from "./prompts/output_schema_images.txt?raw";

// TODO: Prendre en compte la category du fichier pour modifier
// TODO: le prompt d'entrée et le schéma de sortie
export class ExtractRequirements {
  static async extract(input: InputRequirements): Promise<string> {
    const session = await LanguageModel.create({
      expectedOutputs: [{ type: "text", languages: ["en"] }],
      initialPrompts: [{ role: "user", content: prompt }],
    });

    const start = Date.now();
    const res = await session.prompt(input.text_for_requirements.join("\n"), {
      responseConstraint: JSON.parse(output_schema_image),
    });
    const end = Date.now();

    session.destroy();
    console.log(`requirement extraction duration: ${(end - start) / 1000}`);
    return JSON.parse(res);
  }
}
