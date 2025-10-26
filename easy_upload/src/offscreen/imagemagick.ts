import {
  OffscreenCommandExecutionRequest,
  OffscreenCommandExecutionResult,
} from "@/commons/communications_interfaces";
import offscreenPort from "./offscreen_port";
import { getFileInOPFS, writeFileInOPFS } from "@/commons/helpers";
import { MagickOutputFile } from "wasm-imagemagick";

const Magick = await import(
  /* @vite-ignore */ chrome.runtime.getURL("wasm/magickApi.js")
);

function sendExecCommandResponse(id: string, success: boolean) {
  offscreenPort.postMessage({
    name: "exec-command-in-offscreen-resp",
    data: {
      id: id,
      success: success,
    } as OffscreenCommandExecutionResult,
  });
}

export async function executeMagiskCommand(
  request: OffscreenCommandExecutionRequest,
) {
  try {
    const inputFile = await getFileInOPFS(request.inputOPFSFilename);
    if (inputFile == null) {
      throw "l'input file est innexistant ou vide";
    }

    let arrayBuffer = await inputFile.arrayBuffer();
    let sourceBytes = new Uint8Array(arrayBuffer);

    // calling ImageMagick with one source image, and command to rotate & resize image
    // file-type pour

    const command = request.command;
    const inputName = command.match(/input(?:\.\w+)?/)?.[0] || "input";
    const inputFiles = [{ name: inputName, content: sourceBytes }];
    let processedFiles: MagickOutputFile[] = await Magick.Call(
      inputFiles,
      command.split(" "),
    );

    let firstOutputImage = processedFiles[0];

    await writeFileInOPFS(request.outputOPFSFilename, firstOutputImage.blob);
    console.log(`succes de lexecution : Fileouput bien écris dans le OPFS`);
    sendExecCommandResponse(request.id, true);
  } catch (err) {
    console.error(
      "An error occured during the excution of the magisk command:",
    );
    console.error(request);
    console.error(err);
    sendExecCommandResponse(request.id, false);
  }
}