// src/sidepanel/MyCustomComposer.tsx

import { Flex } from "@chatui/core";
import { Composer, ComposerProps } from "@chatui/core/lib/components/Composer";
import { CustomButton } from "./CustomButton";
import { ModelNotifier } from "../notifiers/ModelNotifier";
import { fileUploadFailed } from "../workflow/worflow";

// Define the possible states for the upload
type UploadStatus = "idle" | "success" | "error";

// Add the new prop to the component's props
interface UserInputTextProps extends ComposerProps {
  uploadStatus: UploadStatus;
}

export const UserInputText = (props: UserInputTextProps) => {
  const { uploadStatus, ...composerProps } = props;

  const primaryColor = "#ffb390"; // A standard primary color

  return (
    <div>
      <div
        style={{
          paddingInline: "11px",
          paddingTop: "11px",
          borderTop: "1px solid #f0f0f0",
        }}
      >
        {/* <h3>How did the file upload go?</h3> */}
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
        </Flex>
      </div>

      <Composer {...composerProps} />
    </div>
  );
};
