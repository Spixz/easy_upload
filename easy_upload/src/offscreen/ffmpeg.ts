import { OffscreenCommandExecutionRequest } from "@/commons/communications_interfaces";
import {
  detectFileExt,
  getFileInOPFS,
  writeFileInOPFS,
} from "@/commons/helpers/helpers";

import { sendExecCommandResponse } from "./send_exec_command_response";
import { FFmpeg, FileData } from "@ffmpeg/ffmpeg";

let ffmpeg: FFmpeg | null = null;

export async function ensureFFmpeg(useMultithread = false): Promise<FFmpeg> {
  if (ffmpeg !== null) {
    return ffmpeg;
  }

  console.log(
    `Création d'une instance FFmpeg... Mode Multi-Thread: ${useMultithread}`,
  );
  ffmpeg = new FFmpeg();

  let coreURL, wasmURL, workerURL;

  if (useMultithread) {
    coreURL = chrome.runtime.getURL("wasm/ffmpeg-mt/ffmpeg-core.js");
    wasmURL = chrome.runtime.getURL("wasm/ffmpeg-mt/ffmpeg-core.wasm");
    workerURL = chrome.runtime.getURL("wasm/ffmpeg-mt/ffmpeg-core.worker.js");
  } else {
    coreURL = chrome.runtime.getURL("wasm/ffmpeg/ffmpeg-core.js");
    wasmURL = chrome.runtime.getURL("wasm/ffmpeg/ffmpeg-core.wasm");
  }

  if (useMultithread) {
    await ffmpeg.load({ coreURL, wasmURL, workerURL });
  } else {
    await ffmpeg.load({ coreURL, wasmURL });
  }

  ffmpeg.on("log", ({ message }) => {
    console.warn(`[FFMPEG]: ${message}`);
  });
  ffmpeg.on("progress", ({ progress }) => {
    console.log(`[FFMPEG Progress]: ${(progress * 100).toFixed(1)}%`);
  });

  console.log("✅ ffmpeg loaded !");
  return ffmpeg;
}

export async function executeFmmpegCommand(
  request: OffscreenCommandExecutionRequest,
) {
  try {
    const ffmpeg = await ensureFFmpeg(false);
    const inputFile: File | null = await getFileInOPFS(
      request.inputOPFSFilename,
    );
    if (inputFile == null) {
      throw "l'input file est innexistant ou vide";
    }

    let sourceBytes = new Uint8Array(await inputFile.arrayBuffer());
    // console.log("arrayBuffer byteLength:", arrayBuffer.byteLength);
    // console.log("sourceBytes length:", sourceBytes.length);

    let command: string = request.command;
    const hasOutputType = /\boutput\.\w+\b/.test(command);
    const inputName = command.match(/input(?:\.\w+)?/)?.[0] ?? "input";
    let outputName: string;

    if (hasOutputType) {
      outputName = command.match(/output(?:\.\w+)?/)?.[0]!;
    } else {
      const fileType = await detectFileExt(inputFile);
      console.log(`Type de l'input file ${fileType?.ext}`);
      if (fileType?.ext != null) {
        outputName = `output.${fileType.ext}`;
        command = command.replace("output", outputName);
      } else {
        throw "ffmpeg: The output file format could not be determined from the input file";
      }
    }

    const writeResp = await ffmpeg.writeFile(inputName, sourceBytes);
    console.log(
      `write resp ${writeResp}\n[in:${inputName} | out:${outputName}]\ncommand ${command.split(" ")}`,
    );
    console.log("demarrage de la commande");
    const execResp = await ffmpeg.exec(command.split(" "));
    if (execResp != 0) {
      throw "ffmpeg: ffmpeg.exec() failed";
    }

    const data: FileData = await ffmpeg.readFile(outputName);

    const outputFileBlob = new Blob([
      (data as unknown as { buffer: ArrayBuffer }).buffer,
    ]);

    await writeFileInOPFS(request.outputOPFSFilename, outputFileBlob);
    console.log(`succes de lexecution : Fileouput bien écris dans le OPFS`);
    sendExecCommandResponse(request.id, true);
  } catch (err) {
    console.error(err);
    sendExecCommandResponse(request.id, false);
  }
}
