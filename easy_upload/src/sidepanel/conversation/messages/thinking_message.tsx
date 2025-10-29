import React, { useState } from "react";
import { MessageProps } from "@chatui/core";
import DefaultMessage from "./default_message";
import { User } from "@chatui/core/lib/components/Message/Message";

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

function ThinkingMessageContent({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const messageStyle: React.CSSProperties = {
    backgroundColor: isExpanded ? "#ffffff" : "#ffd1bbff",
    border: "none",
    borderRadius: "10px",
    padding: "8px 12px",
    margin: "10px 0",
    cursor: "pointer",
    transition: "box-shadow 0.3s ease, background-color 0.3s ease",
    boxShadow: isExpanded
      ? "0 4px 8px rgba(0,0,0,0.1)"
      : "0 1px 2px rgba(0,0,0,0.05)",
    overflow: "hidden", 
  };

  const titleStyle: React.CSSProperties = {
    fontWeight: "normal",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const contentWrapperStyle: React.CSSProperties = {
    maxHeight: isExpanded ? "1000px" : "0",
    transition: "max-height 0.4s ease-in-out",
    overflow: "hidden",
  };

  const contentStyle: React.CSSProperties = {
    marginTop: "10px",
    paddingTop: "10px",
    borderTop: "1px solid #eee",
    whiteSpace: "pre-wrap",
  };

  const arrowStyle: React.CSSProperties = {
    transition: "transform 0.3s ease",
    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
    display: "inline-block",
    marginLeft: "20px",
  };

  return (
    <div onClick={handleToggle} style={messageStyle}>
      <div style={titleStyle}>
        <span>{title}</span>
        <span style={arrowStyle}>▶</span>
      </div>
      <div style={contentWrapperStyle}>
        <div style={contentStyle}>{content}</div>
      </div>
    </div>
  );
}
