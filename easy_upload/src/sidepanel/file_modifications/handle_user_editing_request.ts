import { UserTask } from "@/commons/interfaces";
import { ConversationNotifier } from "../conversation/ConversationNotifier";
import {
  AskForTasksExecutionMessage,
  AssistantMessage,
} from "../conversation/messages/messages";
import { ModelNotifier } from "../model/ModelNotifier";
import generateTaskPrompt from "./prompts/generate_tasks_prompt.txt?raw";
import { TasksSessionManagerNotifier } from "../tools/tasks_session_manager";

export async function handleUserEditingRequest(
  userRequest: string,
): Promise<void> {
  const { addMessage } = ConversationNotifier.getState();

  addMessage(new AssistantMessage("I’m preparing a plan to modify your file"));

  const userTasks: UserTask[] = await generateUserTasksFromGoals(userRequest);

  if (userTasks.length == 0) {
    ConversationNotifier.getState().enableUserInput(true);
    return;
  }

  console.log("Les taches sur plan pour modifier le fichier:");
  console.log(userTasks);

  await TasksSessionManagerNotifier.getState().createSession(userTasks);

  const askExecutionMessage = new AskForTasksExecutionMessage();
  ConversationNotifier.getState().addMessage(askExecutionMessage);
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
