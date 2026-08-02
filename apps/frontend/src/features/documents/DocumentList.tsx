'use client';

import React, { useState } from 'react';
import { useDocumentStore } from '../../store/useDocumentStore';
import { useChatStore } from '../../store/useChatStore';
import { useDocumentsQuery, useDeleteDocumentMutation, useReprocessDocumentMutation } from '../../hooks/useDocumentHooks';
import { useConversationsQuery } from '../../hooks/useChatHooks';
import { Badge } from '../../components/ui/Badge';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { DocumentListSkeleton } from './DocumentListSkeleton';
import { ConversationList } from '../chat/ConversationList';
import { FileText, RefreshCw, Trash2 } from 'lucide-react';
import { IDocument } from '@pdf-chatbot/shared';

export const DocumentList: React.FC = () => {
  const { activeDocument, setActiveDocument } = useDocumentStore();
  const { setActiveConversation } = useChatStore();
  const { data: documents = [], isLoading } = useDocumentsQuery();
  const { data: conversations = [] } = useConversationsQuery();
  const deleteMutation = useDeleteDocumentMutation();
  const reprocessMutation = useReprocessDocumentMutation();

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

  return (
    <div className="space-y-2 flex flex-col h-full overflow-hidden">
      <ConfirmModal
        isOpen={!!documentToDelete}
        title="Delete Document"
        message="Are you sure you want to delete this PDF document? This will remove all associated vector embeddings and chat sessions."
        confirmLabel="Delete PDF"
        onConfirm={confirmDelete}
        onCancel={() => setDocumentToDelete(null)}
        loading={deleteMutation.isPending}
      />

      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
        Knowledge Base Files ({documents.length})
      </h4>

      {isLoading ? (
        <DocumentListSkeleton />
      ) : documents.length === 0 ? (
        <div className="p-4 text-center text-xs text-slate-500 bg-slate-900/30 rounded-lg border border-slate-800/50">
          No documents uploaded yet.
        </div>
      ) : (
        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
          {documents.map((doc) => {
            const isActive = activeDocument?.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => handleSelectDocument(doc)}
                className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  isActive
                    ? 'bg-blue-600/10 border-blue-500/50 text-white shadow-md'
                    : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{doc.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                      <span>{doc.chunkCount > 0 ? `${doc.chunkCount} chunks` : 'Parsing...'}</span>
                      <Badge variant={doc.status as any}>{doc.status}</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleReprocess(doc.id, e)}
                    disabled={reprocessMutation.isPending}
                    className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
                    title="Reprocess document vectors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${reprocessMutation.isPending ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDocumentToDelete(doc.id);
                    }}
                    className="p-1 text-slate-400 hover:text-red-400 transition-colors"
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

      {/* Conversation History Session Switcher */}
      <ConversationList />
    </div>
  );
};
