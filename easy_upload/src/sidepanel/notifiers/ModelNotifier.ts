import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { MessagesNotifier } from "./MessagesNotifier";
import { AssistantMessage, UserMessage } from "../messages/messages.ts";
import initialPrompt from "./initial_prompt.txt?raw";

export interface PromptProps {
  message: string;
  role: LanguageModelMessageRole;
  addInUi: { input: boolean; output: boolean };
  streaming: boolean;
}

export interface AddToSessionProps {
  message: string;
  role: LanguageModelMessageRole;
  addInUi: boolean;
}

export interface ModelState {
  session: LanguageModel | null;
  init: () => Promise<void>;
  prompt: (props: PromptProps) => Promise<string | void>;
  addToSession: (props: AddToSessionProps) => void;
}

export const ModelNotifier = create<ModelState>()(
  devtools(
    (set, get) => ({
      session: null,
      init: async () => {
        const session = await LanguageModel.create({
          expectedOutputs: [{ type: "text", languages: ["en"] }],
          initialPrompts: [{ role: "user", content: initialPrompt }],
        });
        set((_) => {
          return { session: session };
        });
      },
      prompt: async (props: PromptProps): Promise<string | void> => {
        const { addMessage, handleStream } = MessagesNotifier.getState();
        const messageToSend: LanguageModelMessage = {
          role: props.role as LanguageModelMessageRole,
          content: props.message,
        };

        if (props.addInUi.input) {
          if (props.role == "user") {
            addMessage(new UserMessage(props.message));
          } else if (props.role == "assistant") {
            addMessage(new AssistantMessage(props.message));
          }
        }

        if (props.addInUi.output && props.streaming) {
          const stream = get().session?.promptStreaming([messageToSend]);
          if (stream != null) {
            const assistantMessage = new AssistantMessage("");
            addMessage(assistantMessage);
            handleStream(assistantMessage._id, stream);
            return;
          }
        }

        const resp = await get().session?.prompt([messageToSend]);
        if (props.addInUi.output) {
          addMessage(new AssistantMessage(resp));
        }
        return resp;
      },
      addToSession: (props: AddToSessionProps) => {
        const { addMessage } = MessagesNotifier.getState();
        const messageToAdd: LanguageModelMessage = {
          role: props.role as LanguageModelMessageRole,
          content: props.message,
        };

        get().session?.append([messageToAdd]);

        if (props.addInUi) {
          if (props.role == "user") {
            addMessage(new UserMessage(props.message));
          } else if (props.role == "assistant") {
            addMessage(new AssistantMessage(props.message));
          }
        }
      },
    }),
    {
      name: "ConversationNotifier",
    },
  ),
);
