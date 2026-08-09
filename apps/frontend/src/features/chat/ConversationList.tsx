'use client';

import React, { useState } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useDocumentStore } from '../../store/useDocumentStore';
import { useConversationsQuery, useDeleteConversationMutation } from '../../hooks/useChatHooks';
import { useDocumentsQuery } from '../../hooks/useDocumentHooks';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { MessageSquare, Clock, Trash2 } from 'lucide-react';
import type { IConversation } from '@pdf-chatbot/shared';

export const ConversationList: React.FC = () => {
  const { activeConversation, setActiveConversation } = useChatStore();
  const { setActiveDocument } = useDocumentStore();
  const { data: conversations = [] } = useConversationsQuery();
  const { data: documents = [] } = useDocumentsQuery();
  const deleteConversationMutation = useDeleteConversationMutation();
  const [convToDelete, setConvToDelete] = useState<string | null>(null);

  const handleSelectConversation = (conv: IConversation) => {
    setActiveConversation(conv);
    const matchingDoc = documents.find((d) => d.id === conv.documentId);
    if (matchingDoc) {
      setActiveDocument(matchingDoc);
    }
  };

  const confirmDelete = () => {
    if (convToDelete) {
      deleteConversationMutation.mutate(convToDelete);
      if (activeConversation?.id === convToDelete) {
        setActiveConversation(null);
      }
      setConvToDelete(null);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ConfirmModal
        isOpen={!!convToDelete}
        title="Delete Chat Session"
        message="Are you sure you want to delete this chat history session? All associated message logs will be permanently deleted."
        confirmLabel="Delete Session"
        onConfirm={confirmDelete}
        onCancel={() => setConvToDelete(null)}
        loading={deleteConversationMutation.isPending}
      />

      <div className="flex items-center justify-between px-1 mb-2">
        <h4 className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-indigo-500" /> Recent Sessions ({conversations.length})
        </h4>
      </div>

      {conversations.length === 0 ? (
        <div className="p-4 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          No previous chat sessions yet.
        </div>
      ) : (
        <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
          {conversations.map((conv) => {
            const isActive = activeConversation?.id === conv.id;
            return (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`group flex items-center justify-between gap-2 p-2.5 rounded-xl cursor-pointer text-xs transition-all border ${
                  isActive
                    ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 dark:bg-indigo-500/10 dark:border-indigo-500/40 dark:text-indigo-200 shadow-xs font-semibold'
                    : 'bg-white dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate flex-1 font-semibold">{conv.title}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConvToDelete(conv.id);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-80 group-hover:opacity-100 transition-all shrink-0"
                  title="Delete Chat Session"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

