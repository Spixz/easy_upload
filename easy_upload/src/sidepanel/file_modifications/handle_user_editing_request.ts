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
import { detectFileExt, getFileInOPFS } from "@/commons/helpers/helpers";
import getFileCategory from "@/commons/helpers/get_file_category";

export async function handleUserEditingRequest(
  userRequest: string,
): Promise<void> {
  const { addMessage } = ConversationNotifier.getState();
  let userTasks: UserTask[] = [];

  addMessage(new AssistantMessage(MessagesLibrary.preaparingAPlan));
  try {
    userTasks = await generateUserTasksFromGoals(userRequest);
    console.log("Tasks detected from user intent:");
    console.log(userTasks);
  } catch {
    return toolsNotFound();
  }

  if (userTasks.length == 0) {
    return toolsNotFound();
  }

  addMessage(new AssistantMessage(tasksListToString(userTasks)));
  console.log("User intent converted into task intents:");
  console.log(userTasks);
  await TasksSessionManagerNotifier.getState().createSession(userTasks);

  const askExecutionMessage = new AskForTasksExecutionMessage();
  ConversationNotifier.getState().addMessage(askExecutionMessage);
}

async function generateUserTasksFromGoals(
  userRequest: string,
): Promise<UserTask[]> {
  const fileToWorkOn =
    TasksSessionManagerNotifier.getState().getFileToWorkOn()!;
  const inputFile = await getFileInOPFS(fileToWorkOn);

  if (inputFile == null) {
    console.error(`generateUserTasksFromGoals: input file not found.`);
    throw "generateUserTasksFromGoals: input file not found.";
  }

  const fileExtension = (await detectFileExt(inputFile))?.ext;
  const fileFormat =
    fileExtension != null ? getFileCategory(fileExtension) : "not found";

  const tasksResp = await ModelNotifier.getState().promptForTask({
    prompt: generateTaskPrompt,
    content: JSON.stringify({ user: userRequest, file_category: fileFormat }),
    outputSchema: {
      tool_name: "string",
      i_want: "string",
    },
    newSession: true,
  });

  return tasksResp as UserTask[];
}

function toolsNotFound() {
  const { addMessage, enableUserInput } = ConversationNotifier.getState();

  addMessage(new AssistantMessage(MessagesLibrary.noToolsForThisTask));
  enableUserInput(true);
}

function tasksListToString(tasks: UserTask[]): string {
  return tasks
    .map((task) => `- I will use the ${task.tool_name} tool to ${task.i_want}`)
    .join("\n");
}
