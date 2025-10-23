import { UserTask } from "@/commons/interfaces";
import { ConversationNotifier } from "../conversation/ConversationNotifier";
import { AssistantMessage } from "../conversation/messages/messages";
import { ModelNotifier } from "../model/ModelNotifier";
import generateTaskPrompt from "./prompts/generate_tasks_prompt.txt?raw";


export async function handleUserEditingRequest(
  userRequest: string,
): Promise<void> {
  const { addMessage } = ConversationNotifier.getState();
  addMessage(
    new AssistantMessage("Alright, I’m preparing a plan to modify your file"),
  );

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
    console.log(tasks);
    addMessage(new AssistantMessage(tasksListToString(tasks)));
  } catch (err) {
    addMessage(
      new AssistantMessage(
        "I don’t have the necessary tools to perform the modification",
      ),
    );
  }
}

function tasksListToString(tasks: UserTask[]): string {
  return tasks
    .map((task) => `- I will use the ${task.tool_name} tool to ${task.i_want}`)
    .join("\n");
}
