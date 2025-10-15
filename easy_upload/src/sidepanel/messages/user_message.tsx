import { User } from "@chatui/core/lib/components/Message/Message";
import DefaultMessage from "./default_message";

export default class UserMessage extends DefaultMessage {
  user: User = { name: "user" };
  type = "text";
  position = "right" as const;
}
