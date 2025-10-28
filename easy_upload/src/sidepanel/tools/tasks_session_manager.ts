import { userInputFilenameInOPFS } from "@/commons/const";
import { ToolTask } from "./tool_task";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { UserTask } from "@/commons/interfaces";
import { ConversationNotifier } from "../conversation/ConversationNotifier";
import AssistantMessage from "../conversation/messages/assistant_message";

export interface TaskSession {
  id: string;
  createdAt: Date;
  status: "pending" | "inProgress" | "done" | "error";
  tasks: ToolTask[];
}

export interface TasksSessionManagerState {
  _sessions: TaskSession[];
  _currentSessionId: string | null;
  _fileToWorkOn: string | null;
  createSession: (userTasks: UserTask[]) => Promise<void>;
  getSession: (sessionId: string) => TaskSession | undefined;
  getCurrentSession: () => TaskSession | undefined;
  execCurrentSession: () => Promise<void>;
  updateTaskInSession: (
    sessionId: string,
    taskIndex: number,
    props: Partial<Omit<ToolTask, "id">>,
  ) => void;
  setFileToWorkOn: (name: string) => void;
  getFileToWorkOn: () => string | null;
}

export const TasksSessionManagerNotifier = create<TasksSessionManagerState>()(
  devtools(
    (set, get) => ({
      _sessions: [],
      _fileToWorkOn: userInputFilenameInOPFS,
      async createSession(userTasks: UserTask[]) {
        let newTasks: ToolTask[] = [];

        for (const userTask of userTasks) {
          const task = await ToolTask.factory(userTask);
          if (task) {
            newTasks.push(task);
          } else {
            const notFoundMessage = new AssistantMessage(
              `The tool ${userTask.tool_name} was not found for the task "${userTask.i_want}"`,
            );
            ConversationNotifier.getState().addMessage(notFoundMessage);
          }
        }

        const newSession: TaskSession = {
          id: crypto.randomUUID(),
          createdAt: new Date(),
          status: "pending",
          tasks: newTasks,
        };

        set((state) => ({
          _sessions: [...state._sessions, newSession],
          _currentSessionId: newSession.id,
        }));
      },
      getSession(sessionId: string): TaskSession | undefined {
        return get()._sessions.find((session) => session.id === sessionId);
      },
      getCurrentSession(): TaskSession | undefined {
        const currentId = get()._currentSessionId;
        return get()._sessions.find((s) => s.id === currentId);
      },

      async execCurrentSession() {
        const currentSessionId = get()._currentSessionId;
        if (!currentSessionId) {
          console.error("Aucune session en cours à exécuter.");
          return;
        }

        const currentSession = get().getCurrentSession();
        if (!currentSession) return;

        set((state) => ({
          _sessions: state._sessions.map((session) =>
            session.id === currentSessionId
              ? { ...session, status: "inProgress" }
              : session,
          ),
        }));

        let sessionFailed = false;

        for (const [index, task] of currentSession.tasks.entries()) {
          console.log(
            `||| Executing Task: ${index} in Session: ${currentSessionId} |||`,
          );
          get().updateTaskInSession(currentSessionId, index, {
            status: "inProgress",
          });

          try {
            await task.exec({ inputOPFSFilename: this.getFileToWorkOn()! });
            this.setFileToWorkOn(task.outputOPFSFilename);
            get().updateTaskInSession(currentSessionId, index, {
              status: "done",
            });
          } catch (err) {
            get().updateTaskInSession(currentSessionId, index, {
              status: "error",
            });
            console.warn(`Error in task ${index}:`, err);
            sessionFailed = true;
            break; // On arrête la session si une tâche échoue
          }
        }

        const finalStatus = sessionFailed ? "error" : "done";
        set((state) => ({
          _sessions: state._sessions.map((session) =>
            session.id === currentSessionId
              ? { ...session, status: finalStatus }
              : session,
          ),
        }));

        const tasksDone = new AssistantMessage(
          "All operations on the file have been performed.",
        );
        ConversationNotifier.getState().addMessage(tasksDone);
        ConversationNotifier.getState().enableUserInput(true);
      },

      async updateTaskInSession(
        sessionId: string,
        taskIndex: number,
        props: Partial<Omit<ToolTask, "id">>,
      ) {
        set((state) => {
          const newSessions = [...state._sessions];
          const sessionIndex = newSessions.findIndex((s) => s.id === sessionId);
          if (sessionIndex === -1) return state;

          const sessionToUpdate = newSessions[sessionIndex];
          const taskToUpdate = sessionToUpdate.tasks[taskIndex];

          if (taskToUpdate) {
            const updatedTasks = [...sessionToUpdate.tasks];
            updatedTasks[taskIndex] = taskToUpdate.copyWith(props);
            newSessions[sessionIndex] = {
              ...sessionToUpdate,
              tasks: updatedTasks,
            };
            return { _sessions: newSessions };
          }
          return state;
        });
      },
      setFileToWorkOn(name: string) {
        set((_) => ({ _fileToWorkOn: name }));
      },
      getFileToWorkOn() {
        return get()._fileToWorkOn;
      },
    }),
    {
      name: "TasksSessionManagerNotifier",
    },
  ),
);
