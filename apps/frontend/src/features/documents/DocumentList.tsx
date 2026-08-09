'use client';

import React, { useState } from 'react';
import { useDocumentStore } from '../../store/useDocumentStore';
import { useChatStore } from '../../store/useChatStore';
import { useDocumentsQuery, useDeleteDocumentMutation, useReprocessDocumentMutation } from '../../hooks/useDocumentHooks';
import { useConversationsQuery } from '../../hooks/useChatHooks';
import { Badge } from '../../components/ui/Badge';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { DocumentListSkeleton } from './DocumentListSkeleton';
import { FileText, RefreshCw, Trash2, Search, Layers, GitCompare, Share2, Brain, GraduationCap, MoreVertical, CheckCircle2 } from 'lucide-react';
import type { IDocument } from '@pdf-chatbot/shared';

interface DocumentListProps {
  onOpenSummary?: (doc: IDocument) => void;
  onOpenStudy?: (doc: IDocument) => void;
  onOpenShare?: (doc: IDocument) => void;
  onOpenCompare?: (selectedDocIds: string[]) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  onOpenSummary,
  onOpenStudy,
  onOpenShare,
  onOpenCompare,
}) => {
  const { activeDocument, setActiveDocument } = useDocumentStore();
  const { setActiveConversation } = useChatStore();
  const { data: documents = [], isLoading } = useDocumentsQuery();
  const { data: conversations = [] } = useConversationsQuery();
  const deleteMutation = useDeleteDocumentMutation();
  const reprocessMutation = useReprocessDocumentMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [openMenuDocId, setOpenMenuDocId] = useState<string | null>(null);

  const handleSelectDocument = (doc: IDocument) => {
    setActiveDocument(doc);
    const matchingConv = conversations.find((c) => c.documentId === doc.id);
    setActiveConversation(matchingConv || null);
    setOpenMenuDocId(null);
  };

  const toggleSelectDocForCompare = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDocIds(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const confirmDelete = () => {
    if (documentToDelete) {
      deleteMutation.mutate(documentToDelete);
      if (activeDocument?.id === documentToDelete) {
        setActiveDocument(null);
        setActiveConversation(null);
      }
      setDocumentToDelete(null);
    }
  };

  const filteredDocs = documents.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden" onClick={() => setOpenMenuDocId(null)}>
      <ConfirmModal
        isOpen={!!documentToDelete}
        title="Delete Document"
        message="Are you sure you want to delete this document? This will remove all associated vector embeddings and chat sessions."
        confirmLabel="Delete Document"
        onConfirm={confirmDelete}
        onCancel={() => setDocumentToDelete(null)}
        loading={deleteMutation.isPending}
      />

      {/* Multi-Doc Compare Bar */}
      {selectedDocIds.length >= 2 && (
        <div className="mb-2.5 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300">
          <span className="font-medium">{selectedDocIds.length} Selected</span>
          <button
            onClick={() => onOpenCompare && onOpenCompare(selectedDocIds)}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1 transition-all shadow-xs"
          >
            <GitCompare className="w-3.5 h-3.5" /> Compare Matrix
          </button>
        </div>
      )}

      {/* Filter Input */}
      {documents.length > 3 && (
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      )}

      <div className="flex items-center justify-between px-1 mb-2">
        <h4 className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-500" /> Documents ({documents.length})
        </h4>
      </div>

      {isLoading ? (
        <DocumentListSkeleton />
      ) : filteredDocs.length === 0 ? (
        <div className="p-5 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          {searchQuery ? 'No matching documents' : 'No documents uploaded yet.'}
        </div>
      ) : (
        <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
          {filteredDocs.map((doc) => {
            const isActive = activeDocument?.id === doc.id;
            const isChecked = selectedDocIds.includes(doc.id);
            const isMenuOpen = openMenuDocId === doc.id;

            return (
              <div
                key={doc.id}
                onClick={() => handleSelectDocument(doc)}
                className={`relative group flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                  isActive
                    ? 'bg-indigo-50/90 border-indigo-200 text-indigo-950 dark:bg-blue-500/10 dark:border-blue-500/40 dark:text-blue-100 shadow-xs font-semibold'
                    : 'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-slate-300/80 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-1 flex-1">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => toggleSelectDocForCompare(doc.id, e as any)}
                    className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer shrink-0"
                    title="Select for multi-doc comparison"
                  />

                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-600 dark:bg-blue-500/20 dark:text-blue-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600'
                  }`}>
                    <FileText className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate leading-tight">{doc.title}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="shrink-0">{doc.chunkCount > 0 ? `${doc.chunkCount} chunks` : 'Processing...'}</span>
                      <span>•</span>
                      <Badge variant={doc.status as any}>{doc.status}</Badge>
                    </div>
                  </div>
                </div>

                {/* Single Clean Three-Dots Action Menu */}
                <div className="relative shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuDocId(isMenuOpen ? null : doc.id);
                    }}
                    className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                      isMenuOpen ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'opacity-80 group-hover:opacity-100'
                    }`}
                    title="Document Options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Popover */}
                  {isMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-8 z-50 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl shadow-slate-900/10 dark:shadow-black/50 py-1 text-xs font-normal transition-all"
                    >
                      <button
                        onClick={() => {
                          setOpenMenuDocId(null);
                          if (onOpenSummary) onOpenSummary(doc);
                        }}
                        className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2"
                      >
                        <Brain className="w-3.5 h-3.5 text-blue-500" /> Summary & Mind Map
                      </button>

                      <button
                        onClick={() => {
                          setOpenMenuDocId(null);
                          if (onOpenStudy) onOpenStudy(doc);
                        }}
                        className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-2"
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-purple-500" /> Study Hub (Quiz/Deck)
                      </button>

                      <button
                        onClick={() => {
                          setOpenMenuDocId(null);
                          if (onOpenShare) onOpenShare(doc);
                        }}
                        className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2"
                      >
                        <Share2 className="w-3.5 h-3.5 text-emerald-500" /> Share Public Link
                      </button>

                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                      <button
                        onClick={() => {
                          setOpenMenuDocId(null);
                          reprocessMutation.mutate(doc.id);
                        }}
                        className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-500" /> Reprocess Document
                      </button>

                      <button
                        onClick={() => {
                          setOpenMenuDocId(null);
                          setDocumentToDelete(doc.id);
                        }}
                        className="w-full px-3 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete Document
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
