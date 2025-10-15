import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { MessagesNotifier } from "./MessagesNotifier";
import { MessageProps } from "@chatui/core";
import UserMessage from "../messages/user_message.tsx";
import AssistantMessage from "../messages/assistant_message";

export interface ModelState {
  session: LanguageModel | null;
  init: () => Promise<void>;
  userPrompt: (message: string) => Promise<void>;
}

export const ModelNotifier = create<ModelState>()(
  devtools(
    (set, get) => ({
      session: null,
      init: async () => {
        const prompt =
          "Tu es un assistant qui aide à la modifiction de fichiers";
        const session = await LanguageModel.create({
          expectedOutputs: [{ type: "text", languages: ["en"] }],
          initialPrompts: [{ role: "user", content: prompt }],
        });
        set((_) => {
          return { session: session };
        });
      },
      userPrompt: async (message: string) => {
        const { addMessage, handleStream } = MessagesNotifier.getState();

        addMessage(new UserMessage(message));

        const stream = get().session?.promptStreaming(message);
        if (stream != null) {
          const assistantMessage: MessageProps = new AssistantMessage("");
          addMessage(assistantMessage);
          handleStream(assistantMessage._id, stream);
        }
      },
    }),
    {
      name: "ConversationNotifier",
    },
  ),
);
