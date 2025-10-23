// src/sidepanel/MyCustomComposer.tsx

import { Flex } from "@chatui/core";
import { Composer, ComposerProps } from "@chatui/core/lib/components/Composer";
import { CustomButton } from "./CustomButton";
import { fileUploadFailed } from "../conversation/handle_user_actions";
import DisabledWrapper from "./DisabledWrapper";
import { ConversationNotifier } from "../conversation/ConversationNotifier";
import { primaryColor } from "@/commons/colors";
import { ToolTask } from "../tools/tool_task";

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
        <Flex wrap="wrap" style={{ gap: "8px" }}>
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
          <CustomButton
            borderColor={primaryColor}
            onClick={() => {
              const imagemagickTask = ToolTask.factory({
                tool_name: "imagemagick",
                i_want: "rotate the image on the left",
              });

              imagemagickTask?.selectCommand();
            }}
            text="test Tool task"
          />
        </Flex>
      </div>

      <DisabledWrapper disabled={!userInputEnabled}>
        <Composer {...composerProps} />
      </DisabledWrapper>
    </div>
  );
};
