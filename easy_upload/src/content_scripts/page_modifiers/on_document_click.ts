import { onInputFileClick } from "./input_file/on_click/on_input_file_click";
import "notyf/notyf.min.css";
import { sendFileToSidepanel } from "../bridge/contentscript_sidepanel_bridges";
import {
  isAwaitingTarget,
  pendingFile,
  resetInjectionState,
} from "../injection_state";
import { displayMessage } from "../display_message";
import MessagesLibrary from "@/commons/messages_library";
import { arrayBufferToBase64 } from "@/commons/helpers/helpers";

export function attachFileInputInterceptor(doc: Document) {
  doc.addEventListener("click", (e) => {
    const input = e.target;
    if (input instanceof HTMLInputElement && input.type === "file") {
      if (isAwaitingTarget) {
        const file = pendingFile;
        if (!file) {
          resetInjectionState();
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));

        resetInjectionState();
        displayMessage(MessagesLibrary.fileSuccessfullyReinjected);
        return;
      }

      input.dataset.originalAccept = input.accept;
      input.dataset.inputSelectedByUser = "";
      input.accept = "*/*";

      onInputFileClick(input);
      const onChange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        const buff: ArrayBuffer = await file.arrayBuffer();
        const base64String = await arrayBufferToBase64(buff);

        console.log(`SEND file to sidepanel`);
        console.log(file);
        sendFileToSidepanel({
          type: "user_input_file_changed",
          data: base64String,
        });
        input.removeEventListener("change", onChange);
      };

      input.addEventListener("change", onChange, { once: true });
    }
  });
}

const observer = new MutationObserver(() => {
  for (const iframe of document.querySelectorAll("iframe")) {
    if (!iframe.dataset.hooked) {
      try {
        if (iframe.contentDocument == null) continue;
        attachFileInputInterceptor(iframe.contentDocument);
        iframe.dataset.hooked = "true";
      } catch {}
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
attachFileInputInterceptor(document);
