import { Bubble, Button, Flex, MessageProps } from "@chatui/core";
import DefaultMessage from "./default_message";
import { User } from "@chatui/core/lib/components/Message/Message";
import { TasksSessionManagerNotifier } from "@/sidepanel/tools/tasks_session_manager";
import { ConversationNotifier } from "../ConversationNotifier";
import AssistantMessage from "./assistant_message";
import TaskManagerMessage from "./tasks_manager/task_manager_message";

function onClickStartTasks() {
  const currentSession =
    TasksSessionManagerNotifier.getState().getCurrentSession();
  if (currentSession == undefined) return;

  const taskManagerMessage = new TaskManagerMessage(currentSession.id);
  ConversationNotifier.getState().addMessage(taskManagerMessage);
  TasksSessionManagerNotifier.getState().execCurrentSession();
}

async function onClickNotStartTasks() {
  const message = new AssistantMessage("Task execution canceled.");
  ConversationNotifier.getState().addMessage(message);
  ConversationNotifier.getState().enableUserInput(true);
}

export default class AskForTasksExecutionMessage extends DefaultMessage {
  user: User = { name: "assistant" };
  type = "text";
  position = "left" as const;

  constructor() {
    super(null);
  }

  renderMessageContent = (_: MessageProps) => {
    return (
      <div>
        <Bubble content={"Do you want to execute the tasks?"} />
        <Flex
          wrap="wrap"
          style={{
            marginTop: "8px",
            gap: "8px",
            position: "relative",
          }}
        >
          <Button color="primary" onClick={onClickStartTasks}>
            Run
          </Button>
          <Button onClick={onClickNotStartTasks}>Cancel</Button>
        </Flex>
      </div>
    );
  };
}
