import {
  MessageProps,
  User,
} from "@chatui/core/lib/components/Message/Message";
import DefaultMessage from "./default_message";
import { Bubble } from "@chatui/core";

export default class AssistantMessage extends DefaultMessage {
  user: User = { name: "assistant" };
  type = "text";
  position = "left" as const;

  renderMessageContent: (message: MessageProps) => React.ReactNode = (
    message,
  ) => {
    return <Bubble content={message.content} />;
  };
}
