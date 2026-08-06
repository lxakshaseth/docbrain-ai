'use client';

import React from 'react';
import { IMessage } from '@pdf-chatbot/shared';
import { MarkdownRenderer } from '../../components/ui/MarkdownRenderer';
import { Bot, User, BookOpen, HelpCircle, ArrowRight } from 'lucide-react';

interface MessageItemProps {
  message: IMessage;
  isStreaming?: boolean;
  onSelectSuggestedQuestion?: (question: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isStreaming = false,
  onSelectSuggestedQuestion,
}) => {
  const isUser = message.sender === 'user';

  // Sample follow-up suggestions for AI responses
  const suggestedQuestions = !isUser ? [
    'Can you summarize key metrics from this page?',
    'What are the core conclusions of this section?',
    'Are there any risk factors mentioned in the PDF?'
  ] : [];

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} mb-5`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div className={`max-w-2xl rounded-2xl p-4 text-sm ${
        isUser
          ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none shadow-sm dark:shadow-lg'
      }`}>
        <MarkdownRenderer content={message.content} />
        
        {isStreaming && (
          <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse rounded-sm" />
        )}

        {/* Source Citations Badges */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Grounded Source Citations:
            </p>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, index) => (
                <div
                  key={index}
                  className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 rounded-lg p-2 text-xs transition-colors"
                >
                  <div className="flex items-center justify-between text-[10px] text-blue-600 dark:text-blue-400 font-medium mb-1">
                    <span>Page {source.pageNumber}</span>
                    <span>{(source.score * 100).toFixed(0)}% match</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 italic">
                    "{source.snippet}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Follow-up Questions */}
        {!isUser && suggestedQuestions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Suggested Follow-up Questions:
            </p>
            <div className="space-y-1.5">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectSuggestedQuestion && onSelectSuggestedQuestion(q)}
                  className="w-full text-left flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 hover:bg-blue-50 dark:hover:bg-blue-600/10 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 text-xs text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 transition-all group"
                >
                  <span>{q}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
