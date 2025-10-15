import inputOnClickListener from "./onClick/update_on_click";
import inputOnChangeListener from "./update_on_change";

console.log("LOADED : input modifiers");

/**
 * Processes a given DOM node to find and modify file inputs and iframes.
 * @param node The DOM node to process.
 */
function processNode(node: Node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const element = node as Element;

  // Find file inputs within the node
  const inputs = element.querySelectorAll('input[type="file"]');
  if (inputs.length > 0) {
    console.log(`✅ ${inputs.length} input[type="file"] found.`);
    inputs.forEach((input) => {
      inputOnChangeListener(input as HTMLInputElement);
      inputOnClickListener(input as HTMLInputElement);
    });
  }

  // Find iframes within the node
  const iframes = element.querySelectorAll("iframe");
  iframes.forEach(handleIframe);
}

/**
 * Sets up listeners and observers for an iframe.
 * @param iframe The iframe element to handle.
 */
function handleIframe(iframe: HTMLIFrameElement) {
  if (iframe.dataset.fileInputObserverAttached) return;
  iframe.dataset.fileInputObserverAttached = "true";

  console.log("Found an iframe, setting up listener...");

  const setup = () => {
    try {
      const iframeDocument = iframe.contentDocument;
      if (iframeDocument) {
        console.log("✅ Iframe is accessible, scanning and observing.");
        processNode(iframeDocument.body); // Initial scan
        setupObserver(iframeDocument.body); // Observe for future changes
      }
    } catch (e) {
      console.warn(
        "Could not access iframe content. This is likely due to cross-origin restrictions.",
        e,
      );
    }
  };

  if (
    iframe.contentDocument &&
    iframe.contentDocument.readyState === "complete"
  ) {
    setup();
  } else {
    iframe.addEventListener("load", setup);
  }
}

function setupObserver(targetNode: Node) {
  const observer = new MutationObserver(() => {
    processNode(targetNode as Element);
  });

  observer.observe(document.body, {
    childList: true, // écoute l’ajout/suppression d’éléments
    subtree: true, // écoute tout le DOM, pas seulement body
  });
}

(function monitorFileInputs() {
  // Initial scan of the main document
  processNode(document.body);

  // Set up the observer for the main document body
  setupObserver(document.body);

  console.log("👀 File input monitoring activated for the page and iframes!");
})();
