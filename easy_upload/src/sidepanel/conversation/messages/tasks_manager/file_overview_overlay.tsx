import { FileCategory } from "@/commons/enums";
import getFileCategory from "@/commons/helpers/get_file_category";
import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url,
).toString();

export interface OverlayProps {
  open: boolean;
  title?: string;
  url?: string;
  extension?: string;
}

export function FileOverviewOverlay({
  overlay,
  onClose,
}: {
  overlay: OverlayProps;
  onClose: () => void;
}) {
  if (!overlay.open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 12,
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {overlay.title && (
          <div style={{ marginBottom: 8, fontWeight: 600 }}>
            {overlay.title}
          </div>
        )}
        {overlay.url && overlay.extension ? (
          <Previewer url={overlay.url} extension={overlay.extension} />
        ) : (
          <div style={{ color: "#6B7280" }}>No content to display</div>
        )}
      </div>
    </div>
  );
}

function Previewer({ url, extension }: { url: string; extension: string }) {
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [pdfHeight, setPdfHeight] = useState<number>();

  useEffect(() => {
    if (containerRef) {
      setPdfHeight(containerRef.clientHeight);
    }
  }, [containerRef]);

  function onDocumentLoadError(error: Error) {
    console.error("Error while loading document:", error.message);
  }

  const fileCategory = getFileCategory(extension);

  if (fileCategory == FileCategory.image) {
    return (
      <img
        src={url}
        alt="preview"
        style={{ display: "block", maxWidth: "90vw", maxHeight: "90vh" }}
      />
    );
  }

  if (fileCategory == FileCategory.video) {
    return (
      <video
        src={url}
        controls
        style={{ display: "block", maxWidth: "90vw", maxHeight: "90vh" }}
      />
    );
  }

  if (fileCategory == FileCategory.audio) {
    return (
      <audio src={url} controls style={{ width: "500px", maxWidth: "90vw" }} />
    );
  }

  if (extension == "pdf") {
    return (
      <div
        ref={setContainerRef}
        style={{
          height: "65vh",
          width: "80vw",
          padding: "0 20px",
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {pdfHeight && (
          <Document file={url}>
            <Page
              renderTextLayer={false}
              renderAnnotationLayer={false}
              height={pdfHeight}
            />
          </Document>
        )}
      </div>
    );
  }

  return <div>Preview not available for this file type</div>;
}
