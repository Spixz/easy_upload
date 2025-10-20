import React from "react";

interface DisabledWrapperProps {
  disabled: boolean;
  children: React.ReactNode;
}

export const DisabledWrapper: React.FC<DisabledWrapperProps> = ({
  disabled,
  children,
}) => {
  const wrapperStyle: React.CSSProperties = {
    opacity: disabled ? 0.5 : 1,
    pointerEvents: disabled ? "none" : "auto",
    transition: "opacity 0.3s ease-in-out",
  };

  return <div style={wrapperStyle}>{children}</div>;
};

export default DisabledWrapper;
