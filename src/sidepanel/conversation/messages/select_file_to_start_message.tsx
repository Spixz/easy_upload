import { Bubble, Button, Flex, MessageProps } from "@chatui/core";
import DefaultMessage from "./default_message";
import { User } from "@chatui/core/lib/components/Message/Message";
import { TasksSessionManagerNotifier } from "@/sidepanel/tools/tasks_session_manager";
import { ConversationNotifier } from "../ConversationNotifier";
import MessagesLibrary from "@/commons/messages_library";
import { generateRandomString } from "@/commons/helpers/helpers";
import AssistantMessage from "./assistant_message";
import UserFileMessage from "./user_file_message";
import { useRef } from "react";

export default class SelectFileToStartMessage extends DefaultMessage {
  user: User = { name: "assistant" };
  type = "text";
  position = "left" as const;

  constructor() {
    super(null);
  }

  renderMessageContent = (_: MessageProps) => {
    return <FileSelectorUI />;
  };
}

function FileSelectorUI() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    const data = await file.arrayBuffer();
    const bytes = new Uint8Array(data);

    if (bytes.length === 0) {
      ConversationNotifier.getState().addMessage(
        new AssistantMessage("The selected file is empty."),
      );
      return;
    }

    const filename = generateRandomString();
    try {
      const root = await navigator.storage.getDirectory();
      const fileHandle = await root.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();

      await writable.write(bytes);
      await writable.close();

      TasksSessionManagerNotifier.getState().setFileToWorkOn(filename);
      const userFileMessage = new UserFileMessage({
        title: file.name,
        opfsFilename: filename,
        showInjectButton: false,
      });
      ConversationNotifier.getState().addMessage(userFileMessage);
    } catch (error) {
      ConversationNotifier.getState().addMessage(
        new AssistantMessage("Sorry, an error occurred while saving the file."),
      );
    }
  };

  return (
    <div>
      <Bubble content={MessagesLibrary.noFileYet} />
      <Flex
        wrap="wrap"
        style={{
          marginTop: "8px",
          gap: "8px",
          position: "relative",
        }}
      >
        <Button color="primary" onClick={handleSelectFileClick}>
          Select file
        </Button>
      </Flex>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept="*"
      />
    </div>
  );
}
