import { fileTypeFromBuffer } from "file-type";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function detectFileExt(file: File | Blob): Promise<string | null> {
  const buffer = new Uint8Array(await file.slice(0, 4100).arrayBuffer());

  const detected = await fileTypeFromBuffer(buffer);
  console.log(`detected via le magic byte : ${detected?.ext}`);
  if (detected?.ext) return detected.ext.toLowerCase();

  const fileName = (file as File).name;
  if (fileName && fileName.includes(".")) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext) return ext;
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
    console.error("Erreur durant la récupération du fichier :", err);
    return null;
  }
}
