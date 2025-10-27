import { fileTypeFromBuffer, FileTypeResult } from "file-type";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function detectFileExt(
  file: File | Blob,
): Promise<FileTypeResult | null> {
  const buffer = new Uint8Array(await file.slice(0, 4100).arrayBuffer());

  const detected = await fileTypeFromBuffer(buffer);
  console.log("extension deterinie");
  console.log(detected);
  if (detected?.ext) return detected;

  const fileName = (file as File).name;
  if (fileName && fileName.includes(".")) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext)
      return {
        ext: ext,
        mime: "",
      } as FileTypeResult;
  }

  return null;
}

export async function checkFileInOPFS(name: string): Promise<boolean> {
  try {
    const root = await navigator.storage.getDirectory();
    const handle = await root.getFileHandle(name);

    if (!handle) return false;

    const file = await handle.getFile();
    if (file.size == 0) return false;

    return true;
  } catch (err: any) {
    console.error("Erreur lors de la vérification du fichier :", err);
    return false;
  }
  return true;
}

export async function getFileInOPFS(filename: string): Promise<File | null> {
  try {
    const root = await navigator.storage.getDirectory();
    const handle = await root.getFileHandle(filename);

    if (!handle) return null;

    const file = await handle.getFile();
    if (file.size == 0) return null;

    return file;
  } catch (err: any) {
    console.error("[getFileInOPFS] erreur");
    console.log(err);
    return null;
  }
}

export async function writeFileInOPFS(
  filename: string,
  fileContent: FileSystemWriteChunkType,
): Promise<void> {
  const root = await navigator.storage.getDirectory();
  const fileHandle = await root.getFileHandle(filename, {
    create: true,
  });
  const writable = await fileHandle.createWritable();

  await writable.write(fileContent);
  await writable.close();
}
