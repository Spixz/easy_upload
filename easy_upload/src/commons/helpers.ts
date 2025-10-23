import { fileTypeFromStream } from "file-type";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}


export async function detectFileExt(file: File | Blob): Promise<string | null> {
  const buffer = new Uint8Array(await file.slice(0, 4100).arrayBuffer());

  const detected = await fromBuffer(buffer);
  if (detected?.ext) return detected.ext.toLowerCase();

  const fileName = (file as File).name;
  if (fileName && fileName.includes(".")) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext) return ext;
  }

  return null;
}