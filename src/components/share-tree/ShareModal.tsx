"use client";

import React, { useState } from "react";
import { X, Download, Link } from "lucide-react";
import { ShareModalProps } from "@/types/family";

export default function ShareModal({
  open,
  onClose,
  onDownload,
  onCopyLink,
}: ShareModalProps) {
  const [showToast, setShowToast] = useState(false);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    });
    onCopyLink();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <h2 className="text-lg text-gray-700 font-semibold mb-4">
          Share Family Tree
        </h2>

        <div className="space-y-3">
          <button
            onClick={() => onDownload("pdf")}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            <Download size={16} />
            <span>Download as PDF</span>
          </button>

          <button
            onClick={() => onDownload("png")}
            className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            <Download size={16} />
            <span>Download as PNG</span>
          </button>

          <div className="flex items-center space-x-2 mt-4">
            <input
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 border rounded text-sm text-gray-700 bg-gray-50"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-300 rounded"
              title="Copy link"
            >
              <Link size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-sm px-4 py-2 rounded shadow-lg z-50">
          Link copied to clipboard!
        </div>
      )}
    </div>
  );
}
