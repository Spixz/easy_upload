import { MessageProps } from "@chatui/core";
import DefaultMessage from "./default_message";
import UserMessage from "./user_message";
import AssistantMessage from "./assistant_message";
import SystemMessage from "./system_message";

export function createMessageInstance(message: MessageProps): DefaultMessage {
  switch (message.user?.name) {
    case "user":
      return Object.assign(new UserMessage(message.content), message);
    case "assistant":
      return Object.assign(new AssistantMessage(message.content), message);
    case "system":
      return Object.assign(new SystemMessage(message.content), message);
    default:
      return Object.assign(new DefaultMessage(message.content), message);
  }
}

export { DefaultMessage, UserMessage, AssistantMessage, SystemMessage };
