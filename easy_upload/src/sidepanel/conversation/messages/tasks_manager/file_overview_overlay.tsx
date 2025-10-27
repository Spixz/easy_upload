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
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (overlay.open) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [overlay.open, onClose]);

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
          maxHeight: "95vh",
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
  const [numPages, setNumPages] = useState<number>();
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>();

  useEffect(() => {
    const handleResize = () => {
      if (containerRef) {
        setContainerWidth(containerRef.clientWidth);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [containerRef]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

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
          width: "50vw",
          background: "#f1f1f1",
        }}
      >
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
        >
          {Array.from(new Array(numPages), (_, index) => (
            <div
              key={`page_container_${index + 1}`}
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "1rem 0",
              }}
            >
              <Page
                pageNumber={index + 1}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                width={containerWidth ? containerWidth * 0.9 : undefined}
              />
            </div>
          ))}
        </Document>
      </div>
    );
  }

  return <div>Preview not available for this file type</div>;
}
