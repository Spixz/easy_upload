import { UserTask } from "@/commons/interfaces";
import { ConversationNotifier } from "../conversation/ConversationNotifier";
import { AssistantMessage } from "../conversation/messages/messages";
import { ModelNotifier } from "../model/ModelNotifier";
import generateTaskPrompt from "./prompts/generate_tasks_prompt.txt?raw";
import { ToolTaskManagerNotifier } from "../tools/tool_task_manager";

export async function handleUserEditingRequest(
  userRequest: string,
): Promise<void> {
  const { addMessage } = ConversationNotifier.getState();

  addMessage(
    new AssistantMessage("Alright, I’m preparing a plan to modify your file"),
  );

  const userTasks = await generateUserTasksFromGoals(userRequest);

  if (userTasks.length == 0) {
    ConversationNotifier.getState().enableUserInput(true);
    return;
  }

  await ToolTaskManagerNotifier.getState().createToolTasksFromUserTasks(
    userTasks,
  );

  // ! si bouton exec cliquer
  await ToolTaskManagerNotifier.getState().execTasks();
  ConversationNotifier.getState().enableUserInput(true);

  // const generateToolsTaskFromTask
}

async function generateUserTasksFromGoals(
  userRequest: string,
): Promise<UserTask[]> {
  const { addMessage } = ConversationNotifier.getState();
  const tasksResp = await ModelNotifier.getState().promptForTask({
    prompt: generateTaskPrompt,
    content: userRequest,
    outputSchema: {
      tool_name: "string",
      i_want: "string",
    },
    newSession: true,
  });

  try {
    const tasks = tasksResp as UserTask[];
    addMessage(new AssistantMessage(tasksListToString(tasks)));
    return tasks;
  } catch (err) {
    addMessage(
      new AssistantMessage(
        "I don’t have the necessary tools to perform the modification",
      ),
    );
    return [];
  }
}

function tasksListToString(tasks: UserTask[]): string {
  return tasks
    .map((task) => `- I will use the ${task.tool_name} tool to ${task.i_want}`)
    .join("\n");
}
