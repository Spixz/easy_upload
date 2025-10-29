export default function openImageEditor(
  opfsFilename: string,
  initialTab?: string,
  initialTool?: string,
) {
  const editorUrl = new URL(
    chrome.runtime.getURL("src/image_ui_editor/index.html"),
  );

  editorUrl.searchParams.set("opfsFilename", opfsFilename);
  if (initialTab) editorUrl.searchParams.set("initialTab", initialTab);
  if (initialTool) editorUrl.searchParams.set("initialTool", initialTool);

  chrome.windows.create({
    url: editorUrl.href,
    type: "popup",
    width: 1200,
    height: 800,
  });
}
