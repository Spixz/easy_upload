import React from "react";
import { BeatLoader } from "react-spinners";
import { primaryColor } from "@/commons/colors";

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
    position: "relative",
  };

  const loaderContainerStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  };

  return (
    <div style={wrapperStyle}>
      {disabled && (
        <div style={loaderContainerStyle}>
          <BeatLoader color={primaryColor} size={13} />
        </div>
      )}
      {children}
    </div>
  );
};

export default DisabledWrapper;
