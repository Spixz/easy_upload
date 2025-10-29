import { UserTask } from "@/commons/interfaces";
import { ConversationNotifier } from "../conversation/ConversationNotifier";
import {
  AskForTasksExecutionMessage,
  AssistantMessage,
} from "../conversation/messages/messages";
import { ModelNotifier } from "../model/ModelNotifier";
import generateTaskPrompt from "./prompts/generate_tasks_prompt.txt?raw";
import { TasksSessionManagerNotifier } from "../tools/tasks_session_manager";
import MessagesLibrary from "@/commons/messages_library";

export async function handleUserEditingRequest(
  userRequest: string,
): Promise<void> {
  const { addMessage } = ConversationNotifier.getState();
  let userTasks: UserTask[] = [];

  addMessage(new AssistantMessage(MessagesLibrary.preaparingAPlan));
  try {
    userTasks = await generateUserTasksFromGoals(userRequest);
  } catch {
    return toolsNotFound();
  }

  if (userTasks.length == 0) {
    return toolsNotFound();
  }

  addMessage(new AssistantMessage(tasksListToString(userTasks)));
  console.log("Les taches sur plan pour modifier le fichier:");
  console.log(userTasks);
  await TasksSessionManagerNotifier.getState().createSession(userTasks);

  const askExecutionMessage = new AskForTasksExecutionMessage();
  ConversationNotifier.getState().addMessage(askExecutionMessage);
}

async function generateUserTasksFromGoals(
  userRequest: string,
): Promise<UserTask[]> {
  const tasksResp = await ModelNotifier.getState().promptForTask({
    prompt: generateTaskPrompt,
    content: userRequest,
    outputSchema: {
      tool_name: "string",
      i_want: "string",
    },
    newSession: true,
  });

  return tasksResp as UserTask[];
}

function toolsNotFound() {
  const { addMessage } = ConversationNotifier.getState();
  const errorMessage = new AssistantMessage(MessagesLibrary.noToolsForThisTask);

  addMessage(errorMessage);
  ConversationNotifier.getState().enableUserInput(true);
}

function tasksListToString(tasks: UserTask[]): string {
  return tasks
    .map((task) => `- I will use the ${task.tool_name} tool to ${task.i_want}`)
    .join("\n");
}
