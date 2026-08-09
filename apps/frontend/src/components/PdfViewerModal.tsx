import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string | null;
  documentTitle: string;
  initialPage?: number;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  initialPage = 1,
}) => {
  const { token } = useAuthStore();
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [pageInput, setPageInput] = useState<string>(initialPage.toString());
  const [zoom, setZoom] = useState<number>(100);

  useEffect(() => {
    if (initialPage) {
      setCurrentPage(initialPage);
      setPageInput(initialPage.toString());
    }
  }, [initialPage, documentId]);

  if (!isOpen || !documentId) return null;

  const baseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/documents/${documentId}/file`;
  const fileApiUrl = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
  const iframeSrc = `${fileApiUrl}#page=${currentPage}&view=FitH`;

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(pageInput, 10);
    if (!isNaN(p) && p >= 1) {
      setCurrentPage(p);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 dark:bg-black/75 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden shadow-2xl shadow-slate-900/10 dark:shadow-black/50">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden pr-2">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white truncate max-w-md">{documentTitle}</h3>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Page Jump Form */}
            <form onSubmit={handlePageSubmit} className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-slate-300">
              <button
                type="button"
                onClick={() => {
                  const newP = Math.max(1, currentPage - 1);
                  setCurrentPage(newP);
                  setPageInput(newP.toString());
                }}
                className="p-1 hover:text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors"
                disabled={currentPage <= 1}
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 font-mono text-xs px-1">
                <span>Page</span>
                <input
                  type="text"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={() => {
                    const p = parseInt(pageInput, 10);
                    if (!isNaN(p) && p >= 1) setCurrentPage(p);
                    else setPageInput(currentPage.toString());
                  }}
                  className="w-10 text-center py-0.5 bg-slate-800 border border-slate-700 rounded text-white font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const newP = currentPage + 1;
                  setCurrentPage(newP);
                  setPageInput(newP.toString());
                }}
                className="p-1 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-slate-300">
              <button onClick={() => setZoom(z => Math.max(50, z - 25))} className="p-1 hover:text-white" title="Zoom Out">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs w-10 text-center font-semibold">{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(200, z + 25))} className="p-1 hover:text-white" title="Zoom In">
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <a
              href={fileApiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
              title="Open full document in new tab"
            >
              <ExternalLink className="w-4 h-4" /> <span className="hidden sm:inline">Open Full Document</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded PDF View */}
        <div className="flex-1 bg-slate-950/80 p-2 sm:p-4 overflow-auto flex items-center justify-center">
          <div
            style={{ width: `${zoom}%`, height: '100%', transition: 'width 0.2s ease-in-out' }}
            className="flex items-center justify-center min-h-[600px]"
          >
            <iframe
              src={iframeSrc}
              className="w-full h-full rounded-xl border border-slate-800/80 bg-white shadow-lg"
              title={documentTitle}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
