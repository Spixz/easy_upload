import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { MessagesNotifier } from "./message/MessageNotifier";
import { MessageProps } from "@chatui/core";

export interface ConversationState {
  session: LanguageModel | null;
  init: () => Promise<void>;
  prompt: (message: string) => Promise<void>;
}

export const ConversationNotifier = create<ConversationState>()(
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
      prompt: async (message: string) => {
        const { createMessage, addMessage, handleStream } =
          MessagesNotifier.getState();

        const userMessage: MessageProps = createMessage({
          type: "text",
          content: message,
          position: "right",
        });
        addMessage(userMessage);

        const stream = get().session?.promptStreaming(message);
        if (stream != null) {
          const assistantMessage: MessageProps = createMessage({
            type: "text",
            content: "",
            position: "left",
          });
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
