'use client';

import React, { useState } from 'react';
import type { IMessage } from '@pdf-chatbot/shared';
import { MarkdownRenderer } from '../../components/ui/MarkdownRenderer';
import { Sparkles, User, BookOpen, ChevronDown, ChevronUp, ArrowRight, CornerDownRight } from 'lucide-react';

interface MessageItemProps {
  message: IMessage;
  isStreaming?: boolean;
  onSelectSuggestedQuestion?: (question: string) => void;
  onCitationClick?: (pageNumber: number) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isStreaming = false,
  onSelectSuggestedQuestion,
  onCitationClick,
}) => {
  const isUser = message.sender === 'user';
  const [showSources, setShowSources] = useState(false);

  // Sample follow-up suggestions for AI responses
  const suggestedQuestions = !isUser ? [
    'Can you summarize key metrics?',
    'What are the core conclusions?',
    'Are there any risk factors?'
  ] : [];

  if (isUser) {
    return (
      <div className="flex gap-3 justify-end my-4">
        <div className="max-w-[85%] md:max-w-[75%] bg-blue-600 dark:bg-blue-600 text-white rounded-2xl rounded-tr-xs px-4 py-3 text-sm shadow-sm font-normal">
          <MarkdownRenderer content={message.content} />
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 text-xs font-semibold">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 justify-start my-6 group">
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
        <Sparkles className="w-4 h-4" />
      </div>

      <div className="flex-1 max-w-full text-slate-800 dark:text-slate-100 text-sm leading-relaxed">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <MarkdownRenderer content={message.content} />
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-1 bg-blue-500 animate-pulse rounded-sm vertical-middle" />
          )}
        </div>

        {/* Grounded Source Citations (Collapsible Pill) */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowSources(!showSources)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400 transition-colors"
            >
              <BookOpen className="w-3 h-3 text-blue-500" />
              <span>{message.sources.length} Grounded {message.sources.length === 1 ? 'Source' : 'Sources'} (Click to View PDF)</span>
              {showSources ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
            </button>

            {showSources && (
              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in duration-200">
                {message.sources.map((source, index) => (
                  <div
                    key={index}
                    onClick={() => onCitationClick && onCitationClick(source.pageNumber || 1)}
                    className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500/50 rounded-xl p-2.5 text-xs cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <div className="flex items-center justify-between text-[10px] text-blue-600 dark:text-blue-400 font-semibold mb-1">
                      <span>Jump to Page {source.pageNumber || 1} ↗</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">{(source.score * 100).toFixed(0)}% match</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 italic leading-relaxed">
                      "{source.snippet}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Suggested Follow-up Questions (Horizontal Chips) */}
        {suggestedQuestions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-900 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <CornerDownRight className="w-3 h-3 text-slate-400" /> Suggested:
            </span>
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => onSelectSuggestedQuestion && onSelectSuggestedQuestion(q)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-900/80 hover:bg-blue-500/10 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-800 hover:border-blue-500/30 text-xs transition-all"
              >
                <span>{q}</span>
                <ArrowRight className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

