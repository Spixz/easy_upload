import { User } from "@chatui/core/lib/components/Message/Message";
import DefaultMessage from "./default_message";

export default class AssistantMessage extends DefaultMessage {
  user: User = { name: "assistant" };
  type = "text";
  position = "left" as const;
}
