import { detectFileExt } from "@/commons/helpers/helpers";
import { TaskStatus, ToolTask } from "@/sidepanel/tools/tool_task";
import { ToolTaskManagerNotifier } from "@/sidepanel/tools/tool_task_manager";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FileOverviewOverlay, OverlayProps } from "./file_overview_overlay";

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

function TaskItem({
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
        <StatusDot status={task.status} />
      </div>
      <div style={styles.item}>
        {children}
        {!isLast && <div style={{ height: 6 }} />}
      </div>
    </div>
  );
}

function ActionButtons({
  task,
  onPreview,
  onDownload,
  onInject,
}: {
  task: ToolTask;
  onPreview: (t: ToolTask) => void;
  onDownload: (t: ToolTask) => void;
  onInject: (t: ToolTask) => void;
}) {
  const disabled = !isActionEnabled(task.status) || !task.outputOPFSFilename;

  return (
    <div style={styles.actions}>
      <button
        style={{ ...styles.button, ...(disabled && styles.buttonDisabled) }}
        disabled={disabled}
        onClick={() => !disabled && onPreview(task)}
      >
        Preview
      </button>
      <button
        style={{ ...styles.button, ...(disabled && styles.buttonDisabled) }}
        disabled={disabled}
        onClick={() => !disabled && onDownload(task)}
      >
        Download
      </button>
      <button
        style={{ ...styles.button, ...(disabled && styles.buttonDisabled) }}
        disabled={disabled}
        onClick={() => !disabled && onInject(task)}
      >
        Inject
      </button>
    </div>
  );
}

export function TasksExecutionInformations() {
  const inputRef = useRef<HTMLInputElement>(null);

  const toolTasks = ToolTaskManagerNotifier((state) => state._toolTasks);

  const [overlay, setOverlay] = useState<OverlayProps>({ open: false });

  const currentIndex = useMemo(
    () => toolTasks.findIndex((t) => t.status === "inProgress"),
    [toolTasks],
  );

  const handlePreview = useCallback(async (t: ToolTask) => {
    if (!t.outputOPFSFilename) return;
    const fileHandle = await navigator.storage
      .getDirectory()
      .then((root) => root.getFileHandle(t.outputOPFSFilename));
    const file = await fileHandle.getFile();
    const url = URL.createObjectURL(file);
    const extension = await detectFileExt(file);

    setOverlay({
      open: true,
      url,
      title: t.goal,
      extension: extension || undefined,
    });
  }, []);

  const handleDownload = useCallback(async (t: ToolTask) => {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle(t.outputOPFSFilename);
    const file = await fileHandle.getFile();
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;

    const ext = await detectFileExt(file);
    a.download = ext ? `${t.outputOPFSFilename}.${ext}` : t.outputOPFSFilename;

    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleInject = useCallback(async (t: ToolTask) => {
    if (!inputRef.current) return;
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle(t.outputOPFSFilename);
    const file = await fileHandle.getFile();

    const dt = new DataTransfer();
    dt.items.add(file);
    inputRef.current.files = dt.files;
    inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
  }, []);

  useEffect(() => {
    return () => {
      if (overlay.url) URL.revokeObjectURL(overlay.url);
    };
  }, [overlay.url]);

  return (
    <div style={styles.card}>
      <div style={styles.header}>Tasks in progress</div>

      {toolTasks.length === 0 ? (
        <div style={{ color: "#9CA3AF", fontSize: 14 }}>No pending tasks.</div>
      ) : (
        <div>
          {toolTasks.map((task, index) => {
            const isLast = index == toolTasks.length - 1;
            const showLineActive =
              ["inProgress", "done", "error"].includes(task.status) ||
              index < currentIndex;

            return (
              <TaskItem
                key={task.id}
                task={task}
                isLast={isLast}
                showRail
                showLineActive={showLineActive}
              >
                <div style={styles.title}>{task.goal}</div>

                {task.commandToExecute && (
                  <div style={styles.metaLine}>
                    <strong>Command:</strong> {task.commandToExecute}
                  </div>
                )}

                <div style={styles.metaLine}>
                  <strong>Status:</strong> {statusLabel(task.status)}
                </div>

                <ActionButtons
                  task={task}
                  onPreview={handlePreview}
                  onDownload={handleDownload}
                  onInject={handleInject}
                />
              </TaskItem>
            );
          })}
        </div>
      )}

      <input ref={inputRef} type="file" hidden />

      <FileOverviewOverlay
        overlay={overlay}
        onClose={() =>
          setOverlay({ open: false, title: "", url: "", extension: "" })
        }
      />
    </div>
  );
}

function isActionEnabled(status: TaskStatus) {
  return status === "done";
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
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: "#111827",
    lineHeight: 1.35,
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
    marginBottom: 6,
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
  } as React.CSSProperties,
  button: {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 10,
    background: "#F9FAFB",
    color: "#111827",
    border: "1px solid #E5E7EB",
    cursor: "pointer",
  } as React.CSSProperties,
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  } as React.CSSProperties,
};
