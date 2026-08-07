'use client';

import React from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useDocumentStore } from '../../store/useDocumentStore';
import { useConversationsQuery } from '../../hooks/useChatHooks';
import { useDocumentsQuery } from '../../hooks/useDocumentHooks';
import { MessageSquare, Clock } from 'lucide-react';
import type { IConversation } from '@pdf-chatbot/shared';

export const ConversationList: React.FC = () => {
  const { activeConversation, setActiveConversation } = useChatStore();
  const { setActiveDocument } = useDocumentStore();
  const { data: conversations = [] } = useConversationsQuery();
  const { data: documents = [] } = useDocumentsQuery();

  const handleSelectConversation = (conv: IConversation) => {
    setActiveConversation(conv);
    const matchingDoc = documents.find((d) => d.id === conv.documentId);
    if (matchingDoc) {
      setActiveDocument(matchingDoc);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
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
                className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer text-xs transition-all border ${
                  isActive
                    ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-950 dark:text-indigo-200 shadow-xs font-medium'
                    : 'bg-white dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <span className="truncate flex-1">{conv.title}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

