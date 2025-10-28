import React from "react";

export function CustomButton({
  onClick,
  borderColor,
  text,
  title,
  isNew,
}: {
  onClick: () => void;
  borderColor?: string;
  text: string;
  title?: string;
  isNew?: boolean;
}) {
  const buttonStyle: React.CSSProperties = {
    position: "relative",
    minWidth: "auto",
    height: "30px",
    padding: "0 10px",
    borderStyle: borderColor ? "solid" : "none",
    borderWidth: borderColor ? "1px" : "0",
    borderColor: borderColor,
    color: "inherit",
    backgroundColor: "white",
    textTransform: "none",
    fontSize: "14px",
    fontWeight: "normal",
    cursor: "pointer",
    borderRadius: "6px",
  };

  const newIndicatorStyle: React.CSSProperties = {
    position: "absolute",
    top: "1px",
    right: "1px",
    width: "8px",
    height: "8px",
    backgroundColor: "red",
    borderRadius: "50%",
  };

  return (
    <button onClick={onClick} style={buttonStyle} title={title}>
      {text}
      {isNew && <span style={newIndicatorStyle}></span>}
    </button>
  );
}
