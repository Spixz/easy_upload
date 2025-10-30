import { UiImageEditorClosingMessage } from "@/commons/communications_interfaces";
import { writeFileInOPFS } from "@/commons/helpers/helpers";
import { useState, useEffect, useMemo } from "react";
import FilerobotImageEditor, {
  TABS,
  TOOLS,
} from "react-filerobot-image-editor";

async function getImageUrlFromOpfs(
  opfsFilename: string,
): Promise<string | null> {
  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle(opfsFilename);
    const file = await fileHandle.getFile();
    return URL.createObjectURL(file);
  } catch (error) {
    console.error("Failed to load image from OPFS:", error);
    return null;
  }
}

export function ImageEditorWindow() {
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const urlParams = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );

  const opfsInputFilename = urlParams.get("opfsInputFilename")!;
  const origin = urlParams.get("origin")!;
  const opfsOutputFilename = urlParams.get("opfsOutputFilename")!;
  const initialTab = urlParams.get("initialTab");

  useEffect(() => {
    if (!opfsInputFilename) {
      setError("Error: No file specified in the URL.");
      return;
    }

    getImageUrlFromOpfs(opfsInputFilename).then((url) => {
      if (url) {
        setSourceImageUrl(url);
      } else {
        setError("Error: Failed to load the image from storage.");
      }
    });

    return () => {
      if (sourceImageUrl) {
        URL.revokeObjectURL(sourceImageUrl);
      }
    };
  }, [opfsInputFilename]);

  async function handleSave(editedImageObject: any) {
    console.log("Image saved!", editedImageObject);

    editedImageObject.imageCanvas.toBlob(async (blob: Blob | null) => {
      const taskMessage = {
        name: "ui_image_editor_closed",
        data: { origin: "task", success: true } as UiImageEditorClosingMessage,
      };
      if (blob) {
        await writeFileInOPFS(opfsOutputFilename, blob);

        if (origin == "task") {
          await chrome.runtime.sendMessage(taskMessage);
        } else {
          await chrome.runtime.sendMessage({
            name: "ui_image_editor_closed",
            data: {
              origin: "edit",
              success: true,
              outputFilenameInOPFS: opfsOutputFilename,
            } as UiImageEditorClosingMessage,
          });
        }
        window.close();
        return;
      }

      console.error("Failed to get blob from canvas.");
      if (origin == "task") {
        await chrome.runtime.sendMessage(taskMessage);
      } else {
        await chrome.runtime.sendMessage({
          name: "ui_image_editor_closed",
          data: {
            origin: "edit",
            success: false,
          } as UiImageEditorClosingMessage,
        });
      }
      window.close();
    });
  }

  if (error) {
    return <h1>{error}</h1>;
  }
  if (!sourceImageUrl) {
    return <h1>Loading image...</h1>;
  }

  return (
    <FilerobotImageEditor
      source={sourceImageUrl}
      onSave={handleSave}
      defaultTabId={
        initialTab && Object.values(TABS).includes(initialTab as any)
          ? (initialTab as any)
          : undefined
      }
      defaultToolId={
        origin && Object.values(TOOLS).includes(origin as any)
          ? (origin as any)
          : undefined
      }
      savingPixelRatio={0}
      previewPixelRatio={0}
    />
  );
}
