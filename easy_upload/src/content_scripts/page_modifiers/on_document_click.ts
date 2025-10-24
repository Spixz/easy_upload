import { onInputFileClick } from "./input_file/onClick/onInputFileClick";
import { sendChunkedMessage } from "ext-send-chunked-message";

export function attachFileInputInterceptor(doc: Document) {
  doc.addEventListener("click", (e) => {
    const input = e.target;
    if (input instanceof HTMLInputElement && input.type === "file") {
      input.dataset.originalAccept = input.accept;
      input.accept = "*/*";

      onInputFileClick(input);
      const onChange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        const buff: ArrayBuffer = await file.arrayBuffer();
        sendChunkedMessage({
          type: "user input file changed",
          data: Array.from(new Uint8Array(buff)),
        });
        // input.value = ""; // permet la re-sélection du même fichier
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
