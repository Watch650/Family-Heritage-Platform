// src/hooks/useShareTree.ts

import { useRef, useState } from "react";
import { downloadAsImageOrPdf } from "@/utils/familyTreeExportUtils";
import { toast } from "react-hot-toast";
import { ReactFlowInstance } from "reactflow";

export function useShareTree() {
  const treeRef = useRef<HTMLDivElement>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const openShareModal = () => setIsShareModalOpen(true);
  const closeShareModal = () => setIsShareModalOpen(false);

  const handleDownload = async (type: "png" | "pdf") => {
    if (!treeRef.current || !reactFlowInstance) {
      toast.error("Tree layout not ready.");
      return;
    }
    const flowElement = treeRef.current?.querySelector(".react-flow") as HTMLElement;
    if (!flowElement) {
      console.error("⚠️ .react-flow element not found");
      return;
    }
    try {
      await downloadAsImageOrPdf(flowElement, type, {
        filename: "family-tree",
        pixelRatio: 2,
        reactFlowInstance,
        fitBeforeCapture: true,
      });
      toast.success(`Downloaded as ${type.toUpperCase()}`);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download the layout.");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      console.error("Copy link failed:", error);
      toast.error("Failed to copy link.");
    }
  };

  return {
    treeRef,
    isShareModalOpen,
    openShareModal,
    closeShareModal,
    handleDownload,
    handleCopyLink,
    reactFlowInstance,
    setReactFlowInstance,
  };
}