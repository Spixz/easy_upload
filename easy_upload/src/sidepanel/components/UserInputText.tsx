// src/sidepanel/MyCustomComposer.tsx

import { Flex } from "@chatui/core";
import { Composer, ComposerProps } from "@chatui/core/lib/components/Composer";
import { CustomButton } from "./CustomButton";
import { fileUploadFailed } from "../conversation/handle_user_actions";
import DisabledWrapper from "./DisabledWrapper";
import { ConversationNotifier } from "../conversation/ConversationNotifier";
import { primaryColor } from "@/commons/colors";
import { userInputFilenameInOPFS } from "@/commons/const";
import { sidepanelPort } from "../sidepanel_listener";
import {
  ChromeBridgeMessage,
  OffscreenCommandExecutionRequest,
} from "@/commons/communications_interfaces";
import { generateRandomString } from "@/commons/helpers/helpers";

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
          <CustomButton
            borderColor={primaryColor}
            onClick={async () => {
              const taskId = generateRandomString();
              sidepanelPort.postMessage({
                name: "exec-command-in-offscreen",
                data: {
                  id: taskId,
                  tool: "ffmpeg",
                  inputOPFSFilename: userInputFilenameInOPFS,
                  outputOPFSFilename: "yyo je suis louptu",
                  command: "-i input -vf format=gray output",
                } as OffscreenCommandExecutionRequest,
              } as ChromeBridgeMessage);
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
