import {
  Bubble,
  MessageProps,
  SystemMessage as SysMessage,
  Think,
} from "@chatui/core";
import DefaultMessage from "./default_message";
import { User } from "@chatui/core/lib/components/Message/Message";
import { ModelMessageRole } from "@/commons/enums";

export default class ThinkingMessage extends DefaultMessage {
  user: User = { name: "system" };
  type = "text";
  position: "left" | "right" | "center" = "center";

  constructor(content: any, role: ModelMessageRole) {
    super(content);
    this.user = { name: role.toString() };

    if (role == ModelMessageRole.user) {
      this.position = "right";
    } else if (role == ModelMessageRole.assistant) {
      this.position = "left";
    } else {
      this.position = "center";
    }
  }

  renderMessageContent(_: MessageProps) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: `${this.position}`,
          width: "100%",
        }}
      >
        {/* <SysMessage content={message.content} /> */}
        <h3>Les requirements</h3>
        <Bubble>
          <Think>
            <p>{this.content}</p>
          </Think>
        </Bubble>
      </div>
    );
  }
}
