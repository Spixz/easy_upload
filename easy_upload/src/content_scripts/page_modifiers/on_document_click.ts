import { detectFileExt } from "@/commons/helpers/helpers";
import { onInputFileClick } from "./input_file/on_click/on_input_file_click";
import {
  addOnChunkedMessageListener,
  sendChunkedMessage,
} from "@/vendors/ext-send-chuncked-message";
import { Notyf } from "notyf";
import "notyf/notyf.min.css";
import MessagesLibrary from "@/commons/messages_library";

export function attachFileInputInterceptor(doc: Document) {
  doc.addEventListener("click", (e) => {
    const input = e.target;
    if (input instanceof HTMLInputElement && input.type === "file") {
      input.dataset.originalAccept = input.accept;
      input.dataset.inputSelectedByUser = "";
      input.accept = "*/*";

      onInputFileClick(input);
      const onChange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        const buff: ArrayBuffer = await file.arrayBuffer();
        sendChunkedMessage(
          {
            type: "user_input_file_changed",
            data: Array.from(new Uint8Array(buff)),
          },
          { channel: "cc-to-panel" },
        );
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

function displayErrorMessage(message: string) {
  const notyf = new Notyf();
  notyf.error({
    message: message,
    duration: 2500,
    position: {
      x: "right",
      y: "bottom",
    },
  });
}

addOnChunkedMessageListener(
  (message: any, _, __) => {
    const selectedInputs: NodeListOf<HTMLInputElement> =
      document.querySelectorAll(
        'input[type="file"][data-input-selected-by-user]',
      );
    if (selectedInputs.length == 0) {
      displayErrorMessage(MessagesLibrary.uploadFieldNoLongerAvailaible);
      return;
    }
    const selectedInput = selectedInputs[0];

    const bytes = new Uint8Array(message.data);
    if (bytes.length == 0) {
      displayErrorMessage(MessagesLibrary.filToReinjectIsEmpty);
      return;
    }

    detectFileExt(new Blob([bytes])).then((fileFormat) => {
      const fileToInject = new File([bytes], "injected_file", {
        type: fileFormat?.ext ?? "",
      });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(fileToInject);
      selectedInput.files = dataTransfer.files;

      selectedInput.dispatchEvent(new Event("change", { bubbles: true }));
      console.log("File successfully injected");
    });
  },
  { channel: "sw-to-cc" },
);

observer.observe(document.body, { childList: true, subtree: true });
attachFileInputInterceptor(document);
