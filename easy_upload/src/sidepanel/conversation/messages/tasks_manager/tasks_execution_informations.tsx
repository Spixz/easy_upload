import { detectFileExt } from "@/commons/helpers/helpers";
import { TaskStatus, ToolTask } from "@/sidepanel/tools/tool_task";
import {
  TaskSession,
  TasksSessionManagerNotifier,
} from "@/sidepanel/tools/tasks_session_manager";
import React, { useCallback, useEffect, useState } from "react";
import { FileOverviewOverlay, OverlayProps } from "./file_overview_overlay";
import { UserFileNotifier } from "@/sidepanel/notifiers/FileNotifier";
import { DownloadIcon, EyeIcon, TargetIcon } from "@/assets/task_icon";

function statusLabel(s: TaskStatus): string {
  switch (s) {
    case "pending":
      return "Pending…";
    case "inProgress":
      return "In progress…";
    case "done":
      return "Done";
    case "error":
      return "Error";
  }
}

export function SessionExecutionInformations({
  sessionId,
}: {
  sessionId: string;
}) {
  const session: TaskSession | undefined = TasksSessionManagerNotifier(
    (state) => state._sessions.find((session) => session.id === sessionId),
  );
  const toolTasks: ToolTask[] = session?.tasks ?? [];

  const fileToWorkOn = TasksSessionManagerNotifier(
    (state) => state._fileToWorkOn,
  );
  const setFileToWorkOn = TasksSessionManagerNotifier(
    (state) => state.setFileToWorkOn,
  );

  const currentIndex = toolTasks.findIndex(
    (task) => task.status === "inProgress",
  );
  const [overlay, setOverlay] = useState<OverlayProps>({ open: false });

  const handlePreview = useCallback(async (task: ToolTask) => {
    if (!task.outputOPFSFilename) return;
    const fileHandle = await navigator.storage
      .getDirectory()
      .then((root) => root.getFileHandle(task.outputOPFSFilename));
    const file = await fileHandle.getFile();
    const url = URL.createObjectURL(file);
    const extension = await detectFileExt(file);
    console.log(`Format of the previewed file ${extension?.ext}`);
    setOverlay({
      open: true,
      url,
      title: task.goal,
      extension: extension?.ext ?? undefined,
    });
  }, []);

  const handleDownload = useCallback(async (task: ToolTask) => {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle(task.outputOPFSFilename);
    const file = await fileHandle.getFile();
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    const format = await detectFileExt(file);
    console.log(`Format of the downloaded file ${format?.ext}`);
    a.download = format?.ext
      ? `${task.outputOPFSFilename}.${format.ext}`
      : task.outputOPFSFilename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleInject = useCallback(async (task: ToolTask) => {
    UserFileNotifier.getState().injectFileInContentScript(
      task.outputOPFSFilename,
    );
  }, []);

  useEffect(() => {
    return () => {
      if (overlay.url) URL.revokeObjectURL(overlay.url);
    };
  }, [overlay.url]);

  return (
    <div style={styles.card}>
      <div style={styles.header}>Session Tasks</div>

      {toolTasks.length === 0 ? (
        <div style={{ color: "#9CA3AF", fontSize: 14 }}>
          No tasks in this session.
        </div>
      ) : (
        <div>
          {toolTasks.map((task, index) => {
            const isLast = index === toolTasks.length - 1;
            const showLineActive =
              ["inProgress", "done", "error"].includes(task.status) ||
              index < currentIndex;
            const isCurrentWorkFile = task.outputOPFSFilename === fileToWorkOn;

            return (
              <TaskItemComponent
                key={task.id}
                task={task}
                isLast={isLast}
                showRail
                showLineActive={showLineActive}
              >
                <div style={styles.titleWrapper}>
                  <div style={styles.title}>{task.goal}</div>
                  {isCurrentWorkFile && (
                    <div title="Current work file">
                      <TargetIcon />
                    </div>
                  )}
                </div>

                {task.commandToExecute && (
                  <div style={styles.metaLine}>
                    <strong>Command:</strong> {task.commandToExecute}
                  </div>
                )}

                <div style={styles.metaLine}>
                  <strong>Status:</strong> {statusLabel(task.status)}
                </div>

                <ActionButtonsComponent
                  task={task}
                  onPreview={handlePreview}
                  onDownload={handleDownload}
                  onInject={handleInject}
                  onSetWorkFile={() => setFileToWorkOn(task.outputOPFSFilename)}
                  isCurrentWorkFile={isCurrentWorkFile}
                />
              </TaskItemComponent>
            );
          })}
        </div>
      )}

      <FileOverviewOverlay
        overlay={overlay}
        onClose={() =>
          setOverlay({ open: false, title: "", url: "", extension: "" })
        }
      />
    </div>
  );
}

function TaskItemComponent({
  task,
  isLast,
  showRail,
  showLineActive,
  children,
}: {
  task: ToolTask;
  isLast: boolean;
  showRail: boolean;
  showLineActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.row}>
      <div style={styles.leftRail}>
        {showRail && <div style={styles.railLine(showLineActive)} />}
        <StatusDotComponent status={task.status} />
      </div>
      <div style={styles.item}>
        {children}
        {!isLast && <div style={{ height: 6 }} />}
      </div>
    </div>
  );
}

function ActionButtonsComponent({
  task,
  onPreview,
  onDownload,
  onInject,
  onSetWorkFile,
  isCurrentWorkFile,
}: {
  task: ToolTask;
  onPreview: (t: ToolTask) => void;
  onDownload: (t: ToolTask) => void;
  onInject: (t: ToolTask) => void;
  onSetWorkFile: () => void;
  isCurrentWorkFile: boolean;
}) {
  const disabled = task.status !== "done";

  return (
    <div style={styles.actions}>
      <button
        style={{ ...styles.iconButton, ...(disabled && styles.buttonDisabled) }}
        disabled={disabled}
        onClick={() => !disabled && onPreview(task)}
        title="Preview file"
      >
        <EyeIcon />
      </button>
      <button
        style={{ ...styles.iconButton, ...(disabled && styles.buttonDisabled) }}
        disabled={disabled}
        onClick={() => !disabled && onDownload(task)}
        title="Download file"
      >
        <DownloadIcon />
      </button>
      <button
        style={{ ...styles.button, ...(disabled && styles.buttonDisabled) }}
        disabled={disabled}
        onClick={() => !disabled && onInject(task)}
      >
        Inject
      </button>
      <button
        style={{
          ...styles.button,
          ...(disabled && styles.buttonDisabled),
          ...(isCurrentWorkFile && styles.buttonActive),
        }}
        disabled={disabled}
        onClick={() => !disabled && onSetWorkFile()}
      >
        {isCurrentWorkFile ? "✓ Active" : "Work from this"}
      </button>
    </div>
  );
}

function StatusDotComponent({ status }: { status: TaskStatus }) {
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
    border: "1px solid #E5E7EB", // Ici c'est ok, on ne le modifie jamais
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
  railLine: (active: boolean): React.CSSProperties => ({
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    background: active ? "#E5E7EB" : "transparent",
  }),
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
  item: {
    paddingBottom: 14,
  } as React.CSSProperties,
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
  metaLine: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
    whiteSpace: "pre-wrap",
  } as React.CSSProperties,
  actions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  } as React.CSSProperties,

  // --- MODIFICATION ICI ---
  button: {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 10,
    background: "#F9FAFB",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 500,
    // On décompose la propriété 'border'
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#E5E7EB",
  } as React.CSSProperties,

  // --- MODIFICATION ICI ---
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
    // On décompose la propriété 'border'
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#E5E7EB",
  } as React.CSSProperties,

  buttonActive: {
    background: "#E0F2FE",
    borderColor: "#7DD3FC", // Maintenant, ceci surcharge proprement la propriété de base
    color: "#0369A1",
    fontWeight: 600,
  } as React.CSSProperties,

  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  } as React.CSSProperties,
};
