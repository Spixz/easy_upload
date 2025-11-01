import DefaultMessage from "../default_message";
import {
  MessageProps,
  User,
} from "@chatui/core/lib/components/Message/Message";
import { SessionExecutionInformations } from "./tasks_execution_informations";

export default class TaskManagerMessage extends DefaultMessage {
  user: User = { name: "assistant" };
  type = "text";
  position = "left" as const;

  constructor(public sessionId: string) {
    super(null);
  }

  renderMessageContent = (_: MessageProps) => {
    return <SessionExecutionInformations sessionId={this.sessionId} />;
  };
}
