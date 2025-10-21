import Chat, { Bubble, MessageProps } from "@chatui/core";
import "@chatui/core/dist/index.css";
import { ReactNode, useEffect } from "react";
import { ModelNotifier } from "./model/ModelNotifier";
import { ConversationNotifier } from "./conversation/ConversationNotifier";
import { DefaultMessage } from "./conversation/messages/messages";
import handleUserMessage from "./conversation/handle_user_message";
import { UserInputText } from "./components/UserInputText";

export default function Tchat() {
  const messages = ConversationNotifier((state) => state.messages);

  useEffect(() => {
    ModelNotifier.getState()
      .init()
      .then(() => {
        console.log("conv initialisée");
      });
  }, []);

  function renderMessageContent(msg: MessageProps): ReactNode {
    const message: DefaultMessage | undefined =
      ConversationNotifier.getState().messages.find(
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
        onSend={handleUserMessage}
        Composer={UserInputText}
        placeholder=""
      />
    </div>
  );
}
