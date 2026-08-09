'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useDocumentStore } from '../../store/useDocumentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useConversationsQuery, useMessagesQuery, useSendMessageMutation } from '../../hooks/useChatHooks';
import { MessageItem } from './MessageItem';
import { Send, Plus, Loader2, Sparkles, FileText, ArrowUp, Zap, Eye, Download, Brain, GraduationCap, Share2 } from 'lucide-react';
import type { IMessage, IDocument } from '@pdf-chatbot/shared';
import { useQueryClient } from '@tanstack/react-query';

interface ChatBoxProps {
  onOpenPdfViewer?: (page?: number) => void;
  onOpenSummary?: (doc: IDocument) => void;
  onOpenStudy?: (doc: IDocument) => void;
  onOpenShare?: (doc: IDocument) => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  onOpenPdfViewer,
  onOpenSummary,
  onOpenStudy,
  onOpenShare,
}) => {
  const {
    activeConversation,
    setActiveConversation,
    isStreaming,
    setIsStreaming,
  } = useChatStore();

  const { activeDocument } = useDocumentStore();
  const { token, user, setAuthModalOpen } = useAuthStore();
  const [inputQuery, setInputQuery] = useState('');
  const [optimisticMessages, setOptimisticMessages] = useState<IMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: fetchedMessages = [] } = useMessagesQuery(activeConversation?.id || null);
  const sendMessageMutation = useSendMessageMutation();

  // Stop streaming & clear optimistic messages when AI assistant response arrives
  useEffect(() => {
    if (fetchedMessages.length > 0) {
      const lastMsg = fetchedMessages[fetchedMessages.length - 1];
      if (lastMsg && lastMsg.sender === 'assistant') {
        setOptimisticMessages([]);
        setIsStreaming(false);
      }
    }
  }, [fetchedMessages]);

  useEffect(() => {
    setOptimisticMessages([]);
    setIsStreaming(false);
  }, [activeDocument?.id]);

  const displayMessages: IMessage[] = [
    ...fetchedMessages,
    ...optimisticMessages.filter(
      (m) => !fetchedMessages.some((f) => f.content === m.content && f.sender === m.sender)
    ),
  ];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages, isStreaming, scrollToBottom]);

  const handleCitationClick = (pageNumber: number) => {
    if (onOpenPdfViewer) onOpenPdfViewer(pageNumber);
  };

  const handleExportChat = () => {
    if (!displayMessages.length) return;
    const mdContent = `# Chat Transcript: ${activeDocument?.title || 'DocBrain AI'}\n\n` +
      displayMessages.map(m => `### ${m.sender === 'user' ? 'User' : 'Assistant'}\n${m.content}\n`).join('\n---\n');
    
    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Chat_${activeDocument?.title.replace(/\s+/g, '_') || 'Transcript'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSendMessageText = async (textToSend: string) => {
    if (!textToSend.trim() || isStreaming) return;

    if (!token) {
      setAuthModalOpen(true);
      return;
    }

    if (!activeDocument) return;

    setInputQuery('');
    setIsStreaming(true);

    const userMsg: IMessage = {
      id: `temp_${Date.now()}`,
      conversationId: activeConversation?.id || 'temp_conv',
      sender: 'user',
      content: textToSend,
      createdAt: new Date().toISOString(),
    };
    setOptimisticMessages(prev => [...prev, userMsg]);

    const timeoutId = setTimeout(() => {
      setIsStreaming(false);
    }, 45000);

    try {
      const resData = await sendMessageMutation.mutateAsync({
        documentId: activeDocument.id,
        query: textToSend,
        conversationId: activeConversation?.id,
      });

      const targetConvId = resData.conversationId || activeConversation?.id;

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

      if (targetConvId) {
        queryClient.invalidateQueries({ queryKey: ['messages', targetConvId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      clearTimeout(timeoutId);
      setOptimisticMessages([]);
      setIsStreaming(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessageText(inputQuery);
  };

  const starterPrompts = [
    { title: 'Summarize Document', text: 'Provide a concise summary of the key points in this PDF.' },
    { title: 'Find Key Takeaways', text: 'What are the main takeaways and conclusions mentioned?' },
    { title: 'Extract Action Items', text: 'List any key action items or important figures in this document.' },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs transition-colors duration-250">
      {/* Workspace Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {activeDocument ? activeDocument.title : 'No PDF Selected'}
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {activeDocument
                ? `${activeDocument.chunkCount || 'Indexing'} chunks ready for AI grounding`
                : 'Select or upload a document from sidebar'}
            </p>
          </div>
        </div>

        {/* Feature Tools Toolbar */}
        {activeDocument && (
          <div className="flex items-center flex-wrap gap-1.5">
            <button
              onClick={() => onOpenPdfViewer && onOpenPdfViewer(1)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30 text-xs font-semibold rounded-xl transition-all shadow-xs"
              title="Open Interactive PDF Reader"
            >
              <Eye className="w-3.5 h-3.5" /> PDF Reader
            </button>

            <button
              onClick={() => onOpenSummary && onOpenSummary(activeDocument)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 text-xs font-semibold rounded-xl transition-all shadow-xs"
              title="AI Executive Summary & Mind Map"
            >
              <Brain className="w-3.5 h-3.5" /> Summary & Map
            </button>

            <button
              onClick={() => onOpenStudy && onOpenStudy(activeDocument)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-500/30 text-xs font-semibold rounded-xl transition-all shadow-xs"
              title="Quiz & Flashcard Study Hub"
            >
              <GraduationCap className="w-3.5 h-3.5" /> Study Hub
            </button>

            <button
              onClick={() => onOpenShare && onOpenShare(activeDocument)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-xl transition-all shadow-xs"
              title="Public Share Link"
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>

            {displayMessages.length > 0 && (
              <button
                onClick={handleExportChat}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl transition-all shadow-xs"
                title="Export Chat as Markdown"
              >
                <Download className="w-3.5 h-3.5" /> Export MD
              </button>
            )}

            <button
              onClick={() => {
                setActiveConversation(null);
                setOptimisticMessages([]);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-blue-500" /> New Chat
            </button>
          </div>
        )}
      </div>

      {/* Main Canvas */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-10">
        <div className="max-w-7xl mx-auto space-y-4">
          {!activeDocument ? (
            <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-blue-950/50 border border-indigo-100 dark:border-blue-900/50 flex items-center justify-center mb-4 text-indigo-600 dark:text-blue-400">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-200">No Document Selected</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                Upload a new PDF or select an existing document from the sidebar to begin instant AI-powered Q&A.
              </p>
            </div>
          ) : displayMessages.length === 0 ? (
            <div className="min-h-[420px] flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-purple-600 flex items-center justify-center text-white mb-3 shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">Knowledge Base Ingested</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1 mb-6">
                Ask any question about <span className="font-medium text-slate-800 dark:text-slate-300">"{activeDocument.title}"</span>.
              </p>

              {/* Starter Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-4xl">
                {starterPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessageText(prompt.text)}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 text-left transition-all hover:shadow-xs group shadow-xs"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1 group-hover:text-indigo-600 dark:group-hover:text-blue-400">
                      <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{prompt.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {prompt.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            displayMessages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                onSelectSuggestedQuestion={(question) => handleSendMessageText(question)}
                onCitationClick={handleCitationClick}
              />
            ))
          )}

          {/* Streaming Loader */}
          {isStreaming && (
            <div className="flex gap-3 justify-start my-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 shadow-xs">
                <span>AI Agent is formulating response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Bottom Chat Input */}
      <div className="p-4 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md shrink-0 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/80 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-sm shadow-slate-200/50"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={!activeDocument || isStreaming}
              placeholder={
                !activeDocument
                  ? 'Select a document from sidebar to ask questions...'
                  : `Ask anything about ${activeDocument.title}...`
              }
              className="flex-1 bg-transparent px-3 py-2 text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!inputQuery.trim() || !activeDocument || isStreaming}
              className="w-9 h-9 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-xs transition-all disabled:opacity-40 disabled:hover:bg-indigo-600 flex items-center justify-center shrink-0"
              title="Send message"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </button>
          </form>
          <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-2">
            DocBrain AI uses page ground-truth citations to provide verified answers from your PDF.
          </p>
        </div>
      </div>
    </div>
  );
};
