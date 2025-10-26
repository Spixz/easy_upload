import { userInputFilenameInOPFS } from "@/commons/const";
import { ToolTask } from "./tool_task";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { UserTask } from "@/commons/interfaces";
import { ConversationNotifier } from "../conversation/ConversationNotifier";
import AssistantMessage from "../conversation/messages/assistant_message";

export interface ToolTaskManagerState {
  _toolTasks: ToolTask[];
  execTasks: () => Promise<void>;
  createToolTasksFromUserTasks: (userTasks: UserTask[]) => Promise<void>;
  setToolTasks: (tasks: ToolTask[]) => Promise<void>;
  getToolTasks: () => ToolTask[];
}

export const ToolTaskManagerNotifier = create<ToolTaskManagerState>()(
  devtools(
    (set, get) => ({
      _toolTasks: [],

      execTasks: async () => {
        let fileToWorkOn: string = userInputFilenameInOPFS;
        const tasks = get()._toolTasks;
        console.log("les taches qui vont etre executes");
        console.log(tasks);

        for (const [index, task] of tasks.entries()) {
          console.log(`||| Execution de la tache : ${index} - ${task.goal} |||`);
          try {
            await task.exec({
              inputOPFSFilename: fileToWorkOn,
            });
            fileToWorkOn = task.outputOPFSFilename;
          } catch (err) {
            console.warn(
              `Une erreur s'est produite durant l'éxécution de la task ${index} - ${task.goal}`,
              err,
            );
          }

          const tasksDone = new AssistantMessage(
            "All operations on the file have been performed.",
          );
          ConversationNotifier.getState().addMessage(tasksDone);
        }
        get().setToolTasks([]);
      },

      async createToolTasksFromUserTasks(userTasks: UserTask[]) {
        for (const userTask of userTasks) {
          const task = await ToolTask.factory(userTask);
          if (task) {
            set((state) => ({ _toolTasks: [...state._toolTasks, task!] }));
          } else {
            const notFoundMessage = new AssistantMessage(
              `The tool ${userTask.tool_name} was not found for the task "${userTask.i_want}"`,
            );
            ConversationNotifier.getState().addMessage(notFoundMessage);
          }
        }
      },

      setToolTasks: (tasks: ToolTask[]) => {
        set({ _toolTasks: tasks });
      },

      getToolTasks: () => {
        return get()._toolTasks;
      },
    }),
    {
      name: "ToolTaskManagerNotifier", // Nom pour les devtools de Zustand/Redux
    },
  ),
);
