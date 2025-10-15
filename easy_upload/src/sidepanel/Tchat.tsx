import Chat, { Bubble, MessageProps } from "@chatui/core";
import "@chatui/core/dist/index.css";
import { ReactNode, useEffect } from "react";
import { ModelNotifier } from "./notifiers/ModelNotifier";
import { MessagesNotifier } from "./notifiers/MessagesNotifier";
import DefaultMessage from "./messages/default_message";
import { createMessageInstance } from "./messages/messages";

export default function Tchat() {
  const messages = MessagesNotifier((state) => state.messages);

  useEffect(() => {
    ModelNotifier.getState()
      .init()
      .then(() => {
        console.log("conv initialisée");
      });
  }, []);

  async function handleSend(type: string, val: string) {
    if (type === "text" && val.trim()) {
      ModelNotifier.getState().userPrompt(val);
    }
  }

  function renderMessageContent(msg: MessageProps): ReactNode {
    const message = createMessageInstance(msg);

    return message.renderMessageContent(msg);
  }

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <Chat
        locale="en-EN"
        navbar={{ title: "Assistant" }}
        messages={messages}
        renderMessageContent={renderMessageContent}
        onSend={handleSend}
      />
    </div>
  );
}
