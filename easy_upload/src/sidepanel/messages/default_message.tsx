import { MessageProps, Bubble } from "@chatui/core";
import { User } from "@chatui/core/lib/components/Message/Message";

export default class DefaultMessage implements Partial<MessageProps> {
  _id = crypto.randomUUID();
  content?: any;
  createdAt = Date.now();
  user: User = { name: "default" };

  constructor(content: any) {
    this.content = content;
  }

  renderMessageContent(message: MessageProps) {
    return <Bubble content={message.content} />;
  }
}