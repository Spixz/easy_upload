import { fileTypeFromBuffer, FileTypeResult } from "file-type";
import { FileCategory } from "../enums";
import getFileCategory from "./get_file_category";

export function generateRandomString(): string {
  return crypto.randomUUID();
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function detectFileExt(
  file: File | Blob,
): Promise<FileTypeResult | null> {
  const buffer = new Uint8Array(await file.slice(0, 4100).arrayBuffer());

  const detected = await fileTypeFromBuffer(buffer);
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

export async function getFileInOPFS(filename: string): Promise<File | null> {
  try {
    const root = await navigator.storage.getDirectory();
    const handle = await root.getFileHandle(filename);

    if (!handle) return null;

    const file = await handle.getFile();
    if (file.size == 0) return null;

    return file;
  } catch (err: any) {
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

export async function getOPFSFileCategory(
  filename: string,
): Promise<FileCategory> {
  const file = await getFileInOPFS(filename);
  if (file == null) return FileCategory.all;

  const extension = await detectFileExt(file);
  if (extension == null) return FileCategory.all;

  return getFileCategory(extension.ext);
}

export function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",", 2)[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(new Blob([buffer]));
  });
}

export function base64ToUintArray(base64Str: string): Uint8Array {
  const binaryString = atob(base64Str);
  const len = binaryString.length;

  // 3. Convertir la chaîne binaire en un Uint8Array (données binaires réelles)
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function clearOPFS() {
  const root = await navigator.storage.getDirectory();
  for await (const [name, _] of root.entries()) {
    await root.removeEntry(name, { recursive: true });
  }
  console.log("✅ OPFS cleared");
}
