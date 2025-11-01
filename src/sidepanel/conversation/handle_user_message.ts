import MessagesLibrary from "@/commons/messages_library";
import { handleUserEditingRequest } from "../file_modifications/handle_user_editing_request";
import { ModelNotifier } from "../model/ModelNotifier";
import { TasksSessionManagerNotifier } from "../tools/tasks_session_manager";
import { ConversationNotifier } from "./ConversationNotifier";
import { AssistantMessage, UserMessage } from "./messages/messages";
import isEtitingRequestInitialPrompt from "./prompts/is_editing_request.txt?raw";

export default async function handleUserMessage(type: string, message: string) {
  const fileToWorkOn = TasksSessionManagerNotifier.getState().getFileToWorkOn();

  if (type === "text" && message.trim()) {
    ConversationNotifier.getState().addMessage(new UserMessage(message));
    ConversationNotifier.getState().enableUserInput(false);

    if (await isEditingRequest(message)) {
      if (fileToWorkOn == null) {
        ConversationNotifier.getState().addMessage(
          new AssistantMessage(MessagesLibrary.noFileToWorkOn),
        );
        ConversationNotifier.getState().enableUserInput(true);
        return;
      }
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
  console.log("is editing request :", res);

  if (
    res &&
    typeof res === "object" &&
    Object.values(res).some((v) => v == true || v == "true")
  ) {
    return true;
  }
  return false;
}
