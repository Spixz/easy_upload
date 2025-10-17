import { MessageProps, SystemMessage as SysMessage } from "@chatui/core";
import DefaultMessage from "./default_message";
import { User } from "@chatui/core/lib/components/Message/Message";

export default class SystemMessage extends DefaultMessage {
  user: User = { name: "system" };
  type = "text";
  position = "center" as const;

  renderMessageContent = (message: MessageProps) => {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <SysMessage content={message.content} />
      </div>
    );
  };
}
