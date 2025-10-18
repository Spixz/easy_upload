// import initExtractPrompt from "./prompts/init_extract_jobs.txt?raw";
type TaskStatus = "pending" | "inProgress" | "done" | "error";

export abstract class Task {
  id: string = crypto.randomUUID();
  toolName: string;
  task: string;
  status: TaskStatus;
  resultPath?: string;

  constructor({
    toolName,
    task,
  }: {
    toolName: string;
    task: string;
    status?: TaskStatus;
    resultPath?: string;
  }) {
    this.toolName = toolName;
    this.task = task;
    this.status = "pending";
  }

  abstract exec(): void;
}

export class TaskManager {
  tasks: Task[] = [];

  /// [message] : le message est généré par l'assitant qui ecrirera une liste de taches
  async messageToJobs(message: string): Promise<Task[]> {
    // model qui génère une liste de task au format json que je parse ensuite
    const session = await LanguageModel.create({
      expectedOutputs: [{ type: "text", languages: ["en"] }],
      // initialPrompts: [{ role: "user", content: initExtractPrompt }],
    });
    return Promise.resolve(this.tasks);
  }
}
