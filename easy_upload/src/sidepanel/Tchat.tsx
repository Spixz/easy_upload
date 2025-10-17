import Chat, { Bubble, MessageProps } from "@chatui/core";
import "@chatui/core/dist/index.css";
import { ReactNode, useEffect } from "react";
import { ModelNotifier } from "./notifiers/ModelNotifier";
import { MessagesNotifier } from "./notifiers/MessagesNotifier";
import { DefaultMessage } from "./messages/messages";
import { UserInputText } from "./components/user_input_text";

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
      ModelNotifier.getState().prompt({
        message: val,
        role: "user",
        addInUi: {
          input: true,
          output: true,
        },
        streaming: true,
      });
    }
  }

  function renderMessageContent(msg: MessageProps): ReactNode {
    const message: DefaultMessage | undefined =
      MessagesNotifier.getState().messages.find(
        (message) => message._id == msg._id,
      );
    const errorMessage = "[Error : something wront happend]";

    return (
      message?.renderMessageContent(msg) ?? <Bubble content={errorMessage} />
    );
  }

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <Chat
        locale="en-US"
        navbar={{ title: "Assistant" }}
        messages={messages}
        renderMessageContent={renderMessageContent}
        onSend={handleSend}
        Composer={UserInputText}
      />
    </div>
  );
}
