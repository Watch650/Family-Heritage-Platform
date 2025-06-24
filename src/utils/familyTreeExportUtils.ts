import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { ReactFlowInstance, Viewport } from "reactflow";

/**
 * Downloads the given element as a PNG or PDF file.
 *
 * @param element - The DOM element to capture.
 * @param type - "png" or "pdf" format.
 * @param options - Optional settings for filename and resolution.
 */
export async function downloadAsImageOrPdf(
  element: HTMLElement,
  type: "png" | "pdf",
  options?: {
    filename?: string;
    pixelRatio?: number;
    reactFlowInstance?: ReactFlowInstance;
    fitBeforeCapture?: boolean;
  }
) {
  const filename = options?.filename ?? "family-tree";
  const pixelRatio = options?.pixelRatio ?? 2;
  const instance = options?.reactFlowInstance;
  const shouldFit = options?.fitBeforeCapture ?? false;

  let originalViewport: Viewport | null = null;

  try {
    // Fit view before capture if requested
    if (shouldFit && instance) {
      originalViewport = instance.getViewport();
      instance.fitView({ padding: 0.2 });
      await new Promise((r) => setTimeout(r, 300)); // Wait for layout update
    }

    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio,
      backgroundColor: "#ffffff",
    });

    if (type === "png") {
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();
    } else {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [element.offsetWidth, element.offsetHeight],
      });

      pdf.addImage(
        dataUrl,
        "PNG",
        0,
        0,
        element.offsetWidth,
        element.offsetHeight
      );
      pdf.save(`${filename}.pdf`);
    }
  } catch (err) {
    console.error("Download failed:", err);
  } finally {
    // Restore original viewport if changed
    if (shouldFit && instance && originalViewport) {
      instance.setViewport(originalViewport);
    }
  }
}