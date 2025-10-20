import { handleUserEditingRequest } from "../file_modifications/handle_user_editing_request";
import { ModelNotifier } from "../model/ModelNotifier";
import { ConversationNotifier } from "./ConversationNotifier";
import { UserMessage } from "./messages/messages";
import isEtitingRequestInitialPrompt from "./prompts/is_editing_request.txt?raw";

export default async function handleUserMessage(type: string, message: string) {
  if (type === "text" && message.trim()) {
    ConversationNotifier.getState().addMessage(new UserMessage(message));
    ConversationNotifier.getState().changeUserInputStatus(false);

    const shouldStopProcessing = await analyseUserMessage(message);

    if (shouldStopProcessing) return;

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

export async function analyseUserMessage(message: string): Promise<boolean> {
  var blockPromptingRequest = false;

  if (await isEditingRequest(message)) blockPromptingRequest = true;
  console.log(`is editing request : ${blockPromptingRequest}`);

  return blockPromptingRequest;
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

  if (
    res &&
    typeof res === "object" &&
    "processUserMessage" in res &&
    res.processUserMessage === true
  ) {
    handleUserEditingRequest();
    return true;
  }
  return false;
}
