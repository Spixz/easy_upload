import { create } from "zustand";
import DefaultMessage from "../messages/default_message";

export interface MessageState {
  messages: DefaultMessage[];
  addMessage: (message: DefaultMessage) => void;
  deleteMessage: (id: string) => void;
  updateMessage: (id: string, updates: Partial<DefaultMessage>) => void;
  handleStream: (id: string, stream: AsyncIterable<string>) => Promise<void>;
}

export const MessagesNotifier = create<MessageState>()((set, get) => ({
  messages: [],
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  deleteMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg._id !== id),
    })),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg._id === id) {
          const newMsg = Object.create(Object.getPrototypeOf(msg));
          return Object.assign(newMsg, msg, updates);
        }
        return msg;
      }),
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
}));
