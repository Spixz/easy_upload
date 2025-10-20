import { LocaleProvider, MessageProps } from "@chatui/core";
import DefaultMessage from "./default_message";
import { User } from "@chatui/core/lib/components/Message/Message";
import ThinkingMessageContent from "./thinking_message_content";

export default class ThinkingMessage extends DefaultMessage {
  user: User = {};
  type = "text";

  constructor(
    public title: string,
    public alignement: "start" | "center" | "end",
    content: any,
  ) {
    super(content);
  }

  renderMessageContent = (message: MessageProps) => {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: `${this.alignement}`,
          width: "100%",
        }}
      >
        <ThinkingMessageContent title={this.title} content={message.content} />
      </div>
    );
  };
}
