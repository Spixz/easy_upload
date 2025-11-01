import { generateRandomString } from "@/commons/helpers/helpers";
import { ConversationNotifier } from "@/sidepanel/conversation/ConversationNotifier";

export default async function openImageEditor({
  opfsInputFilename,
  origin,
  opfsOutputFilename,
  initialTab,
}: {
  opfsInputFilename: string;
  origin: "task" | "edit";
  opfsOutputFilename?: string;
  initialTab?: string;
}): Promise<number> {
  const editorUrl = new URL(
    chrome.runtime.getURL("src/image_ui_editor/index.html"),
  );
  const [currentTab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  const callerTabId = currentTab.id;

  editorUrl.searchParams.set("origin", origin);
  editorUrl.searchParams.set("opfsInputFilename", opfsInputFilename);
  editorUrl.searchParams.set(
    "opfsOutputFilename",
    opfsOutputFilename ?? generateRandomString(),
  );
  if (initialTab) editorUrl.searchParams.set("initialTab", initialTab);
  if (callerTabId)
    editorUrl.searchParams.set("callerTabId", String(callerTabId));

  if (origin == "task") {
    ConversationNotifier.getState().enableUserInput(false);
  }

  const win = await chrome.windows.create({
    url: editorUrl.href,
    type: "popup",
    width: 1200,
    height: 800,
  });

  return win!.id as number;
}
