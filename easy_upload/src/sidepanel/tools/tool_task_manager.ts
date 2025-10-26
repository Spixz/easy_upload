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
  updateTask: (index: number, props: Partial<Omit<ToolTask, "id">>) => void;
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
          console.log(
            `||| Execution de la tache : ${index} - ${task.goal} |||`,
          );
          get().updateTask(index, { status: "inProgress" });

          try {
            await task.exec({
              inputOPFSFilename: fileToWorkOn,
            });
            fileToWorkOn = task.outputOPFSFilename;
            get().updateTask(index, { status: "done" });
          } catch (err) {
            get().updateTask(index, { status: "error" });
            console.warn(
              `An error occured during the execution of the task: ${index} - ${task.goal}`,
              err,
            );
          }
        }
        // get().setToolTasks([]);
        // ! L> Le deplacer pour que les infos reste jusqu'au prochin lancement.

        const tasksDone = new AssistantMessage(
          "All operations on the file have been performed.",
        );
        ConversationNotifier.getState().addMessage(tasksDone);
        ConversationNotifier.getState().enableUserInput(true);
      },

      updateTask(index: number, props: Partial<Omit<ToolTask, "id">>) {
        set((state) => {
          const newTasks = [...state._toolTasks];
          const taskToUpdate = newTasks[index];
          if (taskToUpdate) {
            newTasks[index] = taskToUpdate.copyWith(props);
            return { _toolTasks: newTasks };
          }
          return state;
        });
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
      name: "ToolTaskManagerNotifier",
    },
  ),
);
