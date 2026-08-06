'use client';

import React, { useState } from 'react';
import { useDocumentStore } from '../../store/useDocumentStore';
import { useChatStore } from '../../store/useChatStore';
import { useDocumentsQuery, useDeleteDocumentMutation, useReprocessDocumentMutation } from '../../hooks/useDocumentHooks';
import { useConversationsQuery } from '../../hooks/useChatHooks';
import { Badge } from '../../components/ui/Badge';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { DocumentListSkeleton } from './DocumentListSkeleton';
import { FileText, RefreshCw, Trash2, Search, Layers } from 'lucide-react';
import { IDocument } from '@pdf-chatbot/shared';

export const DocumentList: React.FC = () => {
  const { activeDocument, setActiveDocument } = useDocumentStore();
  const { setActiveConversation } = useChatStore();
  const { data: documents = [], isLoading } = useDocumentsQuery();
  const { data: conversations = [] } = useConversationsQuery();
  const deleteMutation = useDeleteDocumentMutation();
  const reprocessMutation = useReprocessDocumentMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  const handleSelectDocument = (doc: IDocument) => {
    setActiveDocument(doc);
    // Find conversation corresponding to this PDF
    const matchingConv = conversations.find((c) => c.documentId === doc.id);
    setActiveConversation(matchingConv || null);
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

  const handleReprocess = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    reprocessMutation.mutate(docId);
  };

  const filteredDocs = documents.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ConfirmModal
        isOpen={!!documentToDelete}
        title="Delete Document"
        message="Are you sure you want to delete this PDF document? This will remove all associated vector embeddings and chat sessions."
        confirmLabel="Delete PDF"
        onConfirm={confirmDelete}
        onCancel={() => setDocumentToDelete(null)}
        loading={deleteMutation.isPending}
      />

      {/* Search Input */}
      {documents.length > 3 && (
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter PDFs..."
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
        <div className="p-4 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          {searchQuery ? 'No matching documents found' : 'No documents uploaded yet.'}
        </div>
      ) : (
        <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
          {filteredDocs.map((doc) => {
            const isActive = activeDocument?.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => handleSelectDocument(doc)}
                className={`group flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                  isActive
                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-950 dark:text-blue-100 shadow-xs font-medium'
                    : 'bg-white dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-blue-500'
                  }`}>
                    <FileText className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate leading-tight">{doc.title}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                      <span>{doc.chunkCount > 0 ? `${doc.chunkCount} chunks` : 'Parsing...'}</span>
                      <span>•</span>
                      <Badge variant={doc.status as any}>{doc.status}</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleReprocess(doc.id, e)}
                    disabled={reprocessMutation.isPending}
                    className="p-1 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Reprocess vectors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${reprocessMutation.isPending ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDocumentToDelete(doc.id);
                    }}
                    className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

