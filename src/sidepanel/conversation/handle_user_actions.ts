import sleep from "@/utils/sleep";
import { ModelNotifier } from "../model/ModelNotifier";

export async function fileUploadFailed() {
  const { addToSession } = ModelNotifier.getState();

  addToSession({
    role: "user",
    message: "My file upload failed, can you help me?",
    addInUi: true,
  });
  await sleep(600);
  addToSession({
    role: "assistant",
    message:
      "Understood. Please paste the error message below so I can take a look.",
    addInUi: true,
  });
}

// export async function showRequirements() {
//  // a partir du schema, donc de l'objet
//  export const OutputSchemaImages: Record<string, any> = {
//   accepted_source: "string",
//   file_size_limit: "string",
//   height_width: "string",
//   aspect_ratio: "string",
//   other_file_infos: "string",
// };
// // ! le trucc que je genere un requirments qui est une string sauf que dans l'ideal c'est un objet qui a une
// // ! interface sachant que le prompt attend un record<>
// // donc moi la je dois transformer le requirement output en une classe avec des objets
// // et avec
// }

/* 
faire une interface ModelOutputSchema ave d'autre qui en herite : outputSchemaImage, outputSchemaVideo...
Le truc c'est que je dois pouvoir convertir c'est interface en record
*/
