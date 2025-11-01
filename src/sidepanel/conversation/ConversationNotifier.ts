import { create } from "zustand";
import DefaultMessage from "./messages/default_message";
import SelectFileToStartMessage from "./messages/select_file_to_start_message";

export interface ConversationState {
  messages: DefaultMessage[];
  userInputEnabled: boolean;
  addMessage: (message: DefaultMessage) => void;
  deleteMessage: (id: string) => void;
  updateMessage: (id: string, updates: Partial<DefaultMessage>) => void;
  handleStream: (id: string, stream: AsyncIterable<string>) => Promise<void>;
  enableUserInput: (val: boolean) => void;
}

export const ConversationNotifier = create<ConversationState>()((set, get) => {
  (async () => {
    const result = await chrome.storage.session.get("sidePanelOpenReason");

    if (result.sidePanelOpenReason !== "CONTENT_SCRIPT_REQUEST") {
      get().addMessage(new SelectFileToStartMessage());
    }
    await chrome.storage.session.remove("sidePanelOpenReason");
  })();

  return {
    messages: [],
    userInputEnabled: true,
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

      ConversationNotifier.getState().enableUserInput(true);
    },
    enableUserInput: (val) => {
      set((_) => ({ userInputEnabled: val }));
    },
  };
});
