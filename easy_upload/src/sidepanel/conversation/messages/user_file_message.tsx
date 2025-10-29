import React, { useCallback, useEffect, useState } from "react";
import { MessageProps } from "@chatui/core";
import DefaultMessage from "./default_message";
import { User } from "@chatui/core/lib/components/Message/Message";
import {
  FileOverviewOverlay,
  OverlayProps,
} from "./tasks_manager/file_overview_overlay";
import { TasksSessionManagerNotifier } from "@/sidepanel/tools/tasks_session_manager";
import { detectFileExt, getOPFSFileCategory } from "@/commons/helpers/helpers";
import { UserFileNotifier } from "@/sidepanel/notifiers/FileNotifier";
import {
  DownloadIcon,
  EditIcon,
  EyeIcon,
  TargetIcon,
} from "@/assets/task_icon";
import { TaskStatus } from "@/sidepanel/tools/tool_task";
import openImageEditor from "@/image_ui_editor/open_ui_editor";
import { FileCategory } from "@/commons/enums";

export default class UserFileMessage extends DefaultMessage {
  user: User = { name: "assistant" };
  type = "text";
  position = "left" as const;
  title: string;
  opfsFilename: string;
  showInjectButton: boolean;

  constructor({
    title,
    opfsFilename,
    showInjectButton,
  }: {
    title: string;
    opfsFilename: string;
    showInjectButton: boolean;
  }) {
    super(null);
    this.title = title;
    this.opfsFilename = opfsFilename;
    this.showInjectButton = showInjectButton;
  }

  renderMessageContent = (_: MessageProps) => {
    return (
      <SourceFileCard
        title={this.title}
        opfsFilename={this.opfsFilename}
        showInjectButton={this.showInjectButton}
      />
    );
  };
}

export function SourceFileCard({
  title,
  opfsFilename,
  showInjectButton,
}: {
  title: string;
  opfsFilename: string;
  showInjectButton: boolean;
}) {
  const [overlay, setOverlay] = useState<OverlayProps>({ open: false });
  const [fileCategory, setFileCategory] = useState<FileCategory | undefined>();
  const fileToWorkOn = TasksSessionManagerNotifier(
    (state) => state._fileToWorkOn,
  );
  const setFileToWorkOn = TasksSessionManagerNotifier(
    (state) => state.setFileToWorkOn,
  );

  const isCurrentWorkFile = opfsFilename === fileToWorkOn;

  const handlePreview = useCallback(async () => {
    const fileHandle = await navigator.storage
      .getDirectory()
      .then((root) => root.getFileHandle(opfsFilename));
    const file = await fileHandle.getFile();
    const url = URL.createObjectURL(file);
    const extension = await detectFileExt(file);
    setOverlay({
      open: true,
      url,
      title,
      extension: extension?.ext ?? undefined,
    });
  }, [opfsFilename, title]);

  const handleImageEdit = useCallback(async () => {
    openImageEditor(opfsFilename);
  }, [opfsFilename]);

  const handleDownload = useCallback(async () => {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle(opfsFilename);
    const file = await fileHandle.getFile();
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    const format = await detectFileExt(file);
    a.download = format?.ext ? `${opfsFilename}.${format.ext}` : opfsFilename;
    a.click();
    URL.revokeObjectURL(url);
  }, [opfsFilename]);

  const handleInject = useCallback(() => {
    UserFileNotifier.getState().injectFileInContentScript(opfsFilename);
  }, [opfsFilename]);

  useEffect(() => {
    getOPFSFileCategory(opfsFilename).then((type) => setFileCategory(type));
  }, [opfsFilename]);

  useEffect(() => {
    return () => {
      if (overlay.url) URL.revokeObjectURL(overlay.url);
    };
  }, [overlay.url]);

  return (
    <div style={styles.card}>
      <div style={styles.header}>File</div>
      <ItemContainer>
        <div style={styles.titleWrapper}>
          <div style={styles.title}>{title}</div>
          {isCurrentWorkFile && (
            <div title="Current work file">
              <TargetIcon />
            </div>
          )}
        </div>
        <ActionButtons
          status="done"
          onPreview={handlePreview}
          onDownload={handleDownload}
          onInject={handleInject}
          onSetWorkFile={() => setFileToWorkOn(opfsFilename)}
          isCurrentWorkFile={isCurrentWorkFile}
          showInjectButton={showInjectButton}
          fileCategory={fileCategory}
          onImageEdit={handleImageEdit}
        />
      </ItemContainer>
      <FileOverviewOverlay
        overlay={overlay}
        onClose={() =>
          setOverlay({ open: false, title: "", url: "", extension: "" })
        }
      />
    </div>
  );
}

function ItemContainer({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.row}>
      <div style={styles.leftRail}>
        <StatusDot status="done" />
      </div>
      <div style={styles.item}>{children}</div>
    </div>
  );
}

function ActionButtons({
  status,
  onPreview,
  onDownload,
  onInject,
  onSetWorkFile,
  isCurrentWorkFile,
  showInjectButton,
  fileCategory,
  onImageEdit,
}: {
  status: TaskStatus;
  onPreview: () => void;
  onDownload: () => void;
  onInject: () => void;
  onSetWorkFile: () => void;
  isCurrentWorkFile: boolean;
  showInjectButton: boolean;
  fileCategory?: FileCategory;
  onImageEdit: () => void;
}) {
  const disabled = status !== "done";

  return (
    <div style={styles.actions}>
      <button
        style={{ ...styles.iconButton, ...(disabled && styles.buttonDisabled) }}
        disabled={disabled}
        onClick={onPreview}
        title="Preview file"
      >
        <EyeIcon />
      </button>
      {fileCategory === FileCategory.image && (
        <button
          style={{
            ...styles.iconButton,
            ...(disabled && styles.buttonDisabled),
          }}
          disabled={disabled}
          onClick={onImageEdit}
          title="Edit Image"
        >
          <EditIcon />
        </button>
      )}
      <button
        style={{ ...styles.iconButton, ...(disabled && styles.buttonDisabled) }}
        disabled={disabled}
        onClick={onDownload}
        title="Download file"
      >
        <DownloadIcon />
      </button>
      {showInjectButton && (
        <button
          style={{ ...styles.button, ...(disabled && styles.buttonDisabled) }}
          disabled={disabled}
          onClick={onInject}
        >
          Inject
        </button>
      )}
      <button
        style={{
          ...styles.button,
          ...(disabled && styles.buttonDisabled),
          ...(isCurrentWorkFile && styles.buttonActive),
        }}
        disabled={disabled}
        onClick={onSetWorkFile}
      >
        {isCurrentWorkFile ? "✓ Active" : "Work from this"}
      </button>
    </div>
  );
}

function StatusDot({ status }: { status: TaskStatus }) {
  return <div style={styles.dot(STATUS_COLORS[status])} />;
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: "#D1D5DB",
  inProgress: "#faae58ff",
  done: "#10B981",
  error: "#EF4444",
};

const styles = {
  card: {
    borderRadius: 16,
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    padding: 16,
    maxWidth: 720,
    width: "100%",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  } as React.CSSProperties,
  header: {
    fontSize: 16,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 8,
  } as React.CSSProperties,
  row: {
    display: "grid",
    gridTemplateColumns: "28px 1fr",
    columnGap: 12,
    position: "relative",
  } as React.CSSProperties,
  leftRail: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
  } as React.CSSProperties,
  dot: (color: string): React.CSSProperties => ({
    zIndex: 1,
    width: 12,
    height: 12,
    borderRadius: "9999px",
    background: color,
    marginTop: 4,
    boxShadow: "0 0 0 3px #FFFFFF",
    border: "1px solid rgba(0,0,0,0.06)",
  }),
  item: { paddingBottom: 14 } as React.CSSProperties,
  titleWrapper: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    marginBottom: 6,
  } as React.CSSProperties,
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: "#111827",
    lineHeight: 1.35,
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
  } as React.CSSProperties,
  actions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  } as React.CSSProperties,
  button: {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 10,
    background: "#F9FAFB",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 500,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#E5E7EB",
  } as React.CSSProperties,
  iconButton: {
    fontSize: 12,
    padding: "6px",
    borderRadius: 10,
    background: "#F9FAFB",
    color: "#374151",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#E5E7EB",
  } as React.CSSProperties,
  buttonActive: {
    background: "#E0F2FE",
    borderColor: "#7DD3FC",
    color: "#0369A1",
    fontWeight: 600,
  } as React.CSSProperties,
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  } as React.CSSProperties,
};
