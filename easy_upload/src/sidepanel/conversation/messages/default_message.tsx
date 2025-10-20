import { MessageProps, Bubble } from "@chatui/core";
import { User } from "@chatui/core/lib/components/Message/Message";

export default class DefaultMessage implements MessageProps {
  _id = crypto.randomUUID();
  type = "text"; // TODO: ajouter le type au constructeur si utile plus tard
  content?: any;
  createdAt = Date.now();
  user: User = { name: "default" };

  constructor(content: any) {
    this.content = content;
  }

  renderMessageContent: (message: MessageProps) => React.ReactNode = (
    message
  ) => {
    return <Bubble content={message.content} />;
  };
}
