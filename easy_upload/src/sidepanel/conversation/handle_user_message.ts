import { handleUserEditingRequest } from "../file_modifications/handle_user_editing_request";
import { ModelNotifier } from "../model/ModelNotifier";
import { ConversationNotifier } from "./ConversationNotifier";
import { UserMessage } from "./messages/messages";
import isEtitingRequestInitialPrompt from "./prompts/is_editing_request.txt?raw";

export default async function handleUserMessage(type: string, message: string) {
  if (type === "text" && message.trim()) {
    ConversationNotifier.getState().addMessage(new UserMessage(message));
    ConversationNotifier.getState().enableUserInput(false);

    if (await isEditingRequest(message)) {
      handleUserEditingRequest(message);
      return;
    }

    ModelNotifier.getState().prompt({
      message: message,
      role: "user",
      addInUi: {
        input: false,
        output: true,
      },
      streaming: true,
    });
  }
}

async function isEditingRequest(message: string): Promise<boolean> {
  const res: string | Record<string, any> =
    await ModelNotifier.getState().promptForTask({
      prompt: isEtitingRequestInitialPrompt,
      content: message,
      outputSchema: {
        isEditingRequest: "boolean",
      },
      newSession: true,
    });
  console.log("model output :", res);

  if (
    res &&
    typeof res === "object" &&
    Object.values(res).some((v) => v == true || v == "true")
  ) {
    return true;
  }
  return false;
}
