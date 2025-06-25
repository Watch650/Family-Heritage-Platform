import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { downloadAsImageOrPdf } from "@/utils/familyTreeExportUtils";
import type { ReactFlowInstance } from "reactflow";

export function useShareTree(origin: string) {
  const treeRef = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareSlug, setShareSlug] = useState<string | null>(null);

  const openShareModal = async (treeId: string) => {
    try {
      const res = await fetch(`/api/trees/${treeId}/share`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data.shareSlug) {
        toast.error("Failed to generate share link");
        console.error("Share API error:", data);
        return;
      }

      setShareSlug(data.shareSlug);
      setIsShareModalOpen(true);
    } catch (error) {
      toast.error("Error generating share link");
      console.error("Error calling share API:", error);
    }
  };

  const closeShareModal = () => {
    setIsShareModalOpen(false);
  };

  const handleDownload = async (type: "png" | "pdf") => {
    if (!treeRef.current || !reactFlowInstance) {
      toast.error("Tree layout not ready.");
      return;
    }

    const flowElement = treeRef.current.querySelector(".react-flow") as HTMLElement;
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
    if (!shareSlug) {
      toast.error("No share link available");
      return;
    }

    const shareUrl = `${origin}/share/${shareSlug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      console.error("Copy link failed:", error);
      toast.error("Failed to copy link.");
    }
  };

  return {
    treeRef,
    reactFlowInstance,
    setReactFlowInstance,
    isShareModalOpen,
    shareSlug,
    openShareModal,
    closeShareModal,
    handleDownload,
    handleCopyLink,
  };
}