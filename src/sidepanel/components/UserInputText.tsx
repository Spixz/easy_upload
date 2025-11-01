// src/sidepanel/MyCustomComposer.tsx

import { Flex } from "@chatui/core";
import { Composer, ComposerProps } from "@chatui/core/lib/components/Composer";
import { CustomButton } from "./CustomButton";
import { fileUploadFailed } from "../conversation/handle_user_actions";
import DisabledWrapper from "./DisabledWrapper";
import { ConversationNotifier } from "../conversation/ConversationNotifier";
import { primaryColor } from "@/commons/colors";

export const UserInputText = (props: ComposerProps) => {
  const { ...composerProps } = props;
  const userInputEnabled = ConversationNotifier(
    (state) => state.userInputEnabled,
  );

  return (
    <div>
      <div
        style={{
          paddingInline: "11px",
          paddingTop: "11px",
          borderTop: "1px solid #f0f0f0",
        }}
      >
        <Flex
          wrap="wrap"
          style={{
            gap: "8px",
            opacity: userInputEnabled ? 1 : 0.5,
            pointerEvents: userInputEnabled ? "auto" : "none",
            transition: "opacity 0.3s ease-in-out",
            position: "relative",
          }}
        >
          <CustomButton
            borderColor={primaryColor}
            isNew={true}
            onClick={() => fileUploadFailed()}
            text="My file upload failed"
          />
          <CustomButton
            borderColor={primaryColor}
            onClick={() => console.log("Set status to idle")}
            text="What can you do?"
          />
        </Flex>
      </div>

      <DisabledWrapper disabled={!userInputEnabled}>
        <Composer {...composerProps} />
      </DisabledWrapper>
    </div>
  );
};
