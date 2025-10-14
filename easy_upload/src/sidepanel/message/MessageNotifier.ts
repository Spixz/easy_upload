import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { MessageProps } from "@chatui/core";

export interface MessageToCreate {
  type: string;
  content: string;
  position: string;
}

export interface MessageState {
  messages: MessageProps[];
  createMessage(message: MessageToCreate): MessageProps;
  addMessage: (message: MessageProps) => void;
  deleteMessage: (id: string) => void;
  updateMessage: (id: string, updates: Partial<MessageProps>) => void;
  handleStream: (id: string, stream: AsyncIterable<string>) => Promise<void>;
}

export const MessagesNotifier = create<MessageState>()(
  devtools(
    (set, get) => ({
      messages: [],
      createMessage(message: MessageToCreate) {
        return {
          id: crypto.randomUUID(),
          type: message.type,
          content: message.content,
          position: message.position,
        };
      },
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      deleteMessage: (id) =>
        set((state) => ({
          messages: state.messages.filter((msg) => msg._id !== id),
        })),
      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg._id === id ? { ...msg, ...updates } : msg,
          ),
        })),
      handleStream: async (id, stream) => {
        const existingMessage = get().messages.find((msg) => msg._id === id);
        if (existingMessage == undefined) return;

        let txt: string = "";
        for await (const chunk of stream) {
          txt += chunk;
          get().updateMessage(id, {
            content: txt,
          });
        }
      },
    }),
    {
      name: "MessageNotifier",
    },
  ),
);
