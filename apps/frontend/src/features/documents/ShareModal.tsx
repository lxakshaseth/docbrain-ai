import React, { useState } from 'react';
import { X, Share2, Copy, Check, Globe, Lock } from 'lucide-react';
import { fetchApi } from '../../lib/api-client';
import type { IDocument } from '@pdf-chatbot/shared';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: IDocument | null;
  onUpdateDocument?: (doc: IDocument) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  document,
  onUpdateDocument,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [toggling, setToggling] = useState<boolean>(false);

  if (!isOpen || !document) return null;

  const shareUrl = document.shareToken
    ? `${window.location.origin}/share/${document.shareToken}`
    : '';

  const handleToggleShare = () => {
    setToggling(true);
    fetchApi<IDocument>(`/documents/${document.id}/share`, { method: 'POST' })
      .then((res) => {
        if (res.success && res.data) {
          if (onUpdateDocument) onUpdateDocument(res.data);
        }
      })
      .finally(() => setToggling(false));
  };

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 dark:bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 flex flex-col gap-4 shadow-2xl shadow-slate-900/10 dark:shadow-black/50 transition-all">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Public Share Link</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            Enable public sharing to allow anyone with the link to view and query this document without logging in.
          </p>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              {document.isPublicShare ? (
                <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Lock className="w-4 h-4 text-slate-400" />
              )}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {document.isPublicShare ? 'Publicly Accessible' : 'Private (Only You)'}
              </span>
            </div>

            <button
              onClick={handleToggleShare}
              disabled={toggling}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                document.isPublicShare
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {document.isPublicShare ? 'Disable Link' : 'Enable Link'}
            </button>
          </div>

          {document.isPublicShare && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Shareable URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-300 select-all font-mono shadow-xs"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold flex items-center gap-1 transition-all shadow-xs"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
