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
      <div className="flex items-end justify-end gap-2.5 my-4">
        <div className="max-w-[85%] md:max-w-[70%] bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 text-xs md:text-sm font-semibold shadow-md shadow-indigo-500/20 leading-relaxed text-left break-words">
          <MarkdownRenderer content={message.content} />
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 border border-slate-200/90 dark:border-slate-700 flex items-center justify-center shrink-0 text-xs font-bold shadow-2xs">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 justify-start my-6 group">
      <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20 animate-float">
        <Sparkles className="w-4 h-4" />
      </div>

      <div className="flex-1 max-w-full text-slate-800 dark:text-slate-100 text-sm leading-relaxed">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <MarkdownRenderer content={message.content} />
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-500 animate-pulse rounded-sm vertical-middle" />
          )}
        </div>

        {/* Grounded Source Citations (Collapsible Pill) */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowSources(!showSources)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50/80 hover:bg-indigo-100/90 dark:bg-slate-900 dark:hover:bg-slate-800 border border-indigo-100/90 dark:border-slate-800 text-[11px] font-bold text-indigo-900 dark:text-slate-400 transition-all shadow-2xs hover:-translate-y-0.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-blue-400" />
              <span>{message.sources.length} Grounded {message.sources.length === 1 ? 'Source' : 'Sources'} (Click to View PDF)</span>
              {showSources ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
            </button>

            {showSources && (
              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-in fade-in duration-200">
                {message.sources.map((source, index) => (
                  <div
                    key={index}
                    onClick={() => onCitationClick && onCitationClick(source.pageNumber || 1)}
                    className="bg-white/90 dark:bg-slate-900/60 border border-white/90 dark:border-slate-800/80 hover:border-indigo-300 rounded-2xl p-3 text-xs cursor-pointer transition-all duration-300 hover:shadow-antigravity-card hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between text-[10px] text-indigo-600 dark:text-blue-400 font-bold mb-1">
                      <span>Jump to Page {source.pageNumber || 1} ↗</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono font-semibold">{(source.score * 100).toFixed(0)}% match</span>
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
          <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-900 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <CornerDownRight className="w-3 h-3 text-slate-400" /> Suggested:
            </span>
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => onSelectSuggestedQuestion && onSelectSuggestedQuestion(q)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white hover:bg-indigo-50/80 dark:bg-slate-900/80 hover:text-indigo-700 border border-slate-200/90 hover:border-indigo-200 text-slate-700 dark:text-slate-300 text-xs transition-all shadow-2xs hover:-translate-y-0.5"
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

