import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ConversationNotifier } from "../conversation/ConversationNotifier.ts";
import {
  AssistantMessage,
  UserMessage,
} from "../conversation/messages/messages.ts";
import initialPrompt from "./initial_prompt.txt?raw";

export interface PromptProps {
  message: string;
  role: LanguageModelMessageRole;
  addInUi: { input: boolean; output: boolean };
  streaming: boolean;
}

export interface PromptForTask {
  prompt: string;
  content: string;
  outputSchema: Record<string, any> | null;
  newSession: boolean;
}

export interface AddToSessionProps {
  message: string;
  role: LanguageModelMessageRole;
  addInUi: boolean;
}

export interface ModelState {
  session: LanguageModel | null;
  abortController: AbortController;
  init: () => Promise<void>;
  prompt: (props: PromptProps) => Promise<string | void>;
  terminateSession: () => void;
  addToSession: (props: AddToSessionProps) => void;
  promptForTask: (
    props: PromptForTask,
  ) => Promise<string | Record<string, any>>;
}

export const ModelNotifier = create<ModelState>()(
  devtools(
    (set, get) => ({
      session: null,
      abortController: new AbortController(),
      init: async () => {
        const session = await LanguageModel.create({
          expectedOutputs: [{ type: "text", languages: ["en"] }],
          initialPrompts: [{ role: "system", content: initialPrompt }],
        });
        set((_) => ({
          session: session,
        }));
      },
      prompt: async (props: PromptProps): Promise<string | void> => {
        const { addMessage, handleStream } = ConversationNotifier.getState();
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
          const stream = get().session?.promptStreaming([messageToSend], {
            signal: get().abortController.signal,
          });
          if (stream != null) {
            const assistantMessage = new AssistantMessage("");
            addMessage(assistantMessage);
            handleStream(assistantMessage._id, stream);
            stream;
            return;
          }
        }

        const resp = await get().session?.prompt([messageToSend], {
          signal: get().abortController.signal,
        });
        if (props.addInUi.output) {
          addMessage(new AssistantMessage(resp));
        }
        return resp;
      },
      cancelPrompt: () => {
        get().abortController.abort("Session terminated");
        ConversationNotifier.getState().enableUserInput(true);
      },
      async promptForTask(
        props: PromptForTask,
      ): Promise<string | Record<string, any>> {
        var result: string;

        if (props.newSession) {
          const session = await LanguageModel.create({
            expectedOutputs: [{ type: "text", languages: ["en"] }],
            initialPrompts: [{ role: "system", content: props.prompt }],
          });
          result = await session.prompt(props.content, {
            ...(props.outputSchema != null
              ? { responseConstraint: props.outputSchema }
              : null),
          });
        } else {
          result = await get().session!.prompt(props.content, {
            ...(props.outputSchema != null
              ? { responseConstraint: props.outputSchema }
              : null),
          });
        }

        if (props.outputSchema != null) return JSON.parse(result);
        return result;
      },
      addToSession: (props: AddToSessionProps) => {
        const { addMessage } = ConversationNotifier.getState();
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
