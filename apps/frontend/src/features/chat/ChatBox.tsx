'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useDocumentStore } from '../../store/useDocumentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useConversationsQuery, useMessagesQuery, useSendMessageMutation } from '../../hooks/useChatHooks';
import { MessageItem } from './MessageItem';
import { Send, MessageSquare, Plus, Loader2, Sparkles } from 'lucide-react';
import { IMessage } from '@pdf-chatbot/shared';
import { useQueryClient } from '@tanstack/react-query';

export const ChatBox: React.FC = () => {
  const {
    activeConversation,
    setActiveConversation,
    messages,
    setMessages,
    addMessage,
    isStreaming,
    setIsStreaming,
  } = useChatStore();

  const { activeDocument } = useDocumentStore();
  const { token, user, setAuthModalOpen } = useAuthStore();
  const [inputQuery, setInputQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useConversationsQuery();
  const { data: fetchedMessages = [] } = useMessagesQuery(activeConversation?.id || null);
  const sendMessageMutation = useSendMessageMutation();

  useEffect(() => {
    if (fetchedMessages.length > 0) {
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSendMessageText = async (textToSend: string) => {
    if (!textToSend.trim() || isStreaming) return;

    if (!token) {
      setAuthModalOpen(true);
      return;
    }

    if (!activeDocument) return;

    setInputQuery('');
    setIsStreaming(true);

    // Optimistic User Message
    const userMsg: IMessage = {
      id: `temp_${Date.now()}`,
      conversationId: activeConversation?.id || 'temp_conv',
      sender: 'user',
      content: textToSend,
      createdAt: new Date().toISOString(),
    };
    addMessage(userMsg);

    try {
      const resData = await sendMessageMutation.mutateAsync({
        documentId: activeDocument.id,
        query: textToSend,
        conversationId: activeConversation?.id,
      });

      const targetConvId = resData.conversationId || activeConversation?.id;

      // Update activeConversation if starting a new session
      if (resData.conversationId && (!activeConversation || activeConversation.id !== resData.conversationId)) {
        setActiveConversation({
          id: resData.conversationId,
          userId: user?.id || '',
          documentId: activeDocument.id,
          title: `Chat with ${activeDocument.title}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Poll/refetch messages after Python completes Redis stream & saves to MongoDB
      setTimeout(() => {
        if (targetConvId) {
          queryClient.invalidateQueries({ queryKey: ['messages', targetConvId] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
        setIsStreaming(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to send message:', err);
      setIsStreaming(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessageText(inputQuery);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <div>
            <h2 className="text-sm font-semibold text-white">
              {activeDocument ? activeDocument.title : 'Select a PDF Document'}
            </h2>
            <p className="text-[11px] text-slate-400">
              {activeDocument
                ? `Vector Store Collection: ${activeDocument.vectorCollectionId}`
                : 'Upload or select a knowledge base document from sidebar'}
            </p>
          </div>
        </div>

        {activeDocument && (
          <button
            onClick={() => setActiveConversation(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" /> New Session
          </button>
        )}
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {!activeDocument ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <MessageSquare className="w-12 h-12 mb-3 text-slate-600" />
            <p className="text-sm font-medium text-slate-300">No PDF Document Selected</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Upload or select a PDF document from the left sidebar to start AI ground-truth Q&A.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <Sparkles className="w-10 h-10 mb-3 text-blue-400/60" />
            <p className="text-sm font-medium text-slate-300">Knowledge Base Ready</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Ask any question regarding '{activeDocument.title}'. The AI agent will cite exact source pages.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              onSelectSuggestedQuestion={(question) => handleSendMessageText(question)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/40">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={!activeDocument || isStreaming}
            placeholder={
              !activeDocument
                ? 'Select a document to ask questions...'
                : 'Ask anything about your PDF document...'
            }
            className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || !activeDocument || isStreaming}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 flex items-center justify-center"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
