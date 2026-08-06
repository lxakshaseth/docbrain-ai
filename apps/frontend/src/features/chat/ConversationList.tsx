'use client';

import React from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useDocumentStore } from '../../store/useDocumentStore';
import { useConversationsQuery } from '../../hooks/useChatHooks';
import { useDocumentsQuery } from '../../hooks/useDocumentHooks';
import { MessageSquare, Clock } from 'lucide-react';
import { IConversation } from '@pdf-chatbot/shared';

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

  if (conversations.length === 0) return null;

  return (
    <div className="space-y-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/80">
      <h4 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Recent Sessions ({conversations.length})
      </h4>

      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
        {conversations.map((conv) => {
          const isActive = activeConversation?.id === conv.id;
          return (
            <div
              key={conv.id}
              onClick={() => handleSelectConversation(conv)}
              className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                isActive
                  ? 'bg-indigo-500/10 border border-indigo-500/40 text-indigo-600 dark:text-indigo-300 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
              <span className="truncate">{conv.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
