'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Simple clean markdown parser for bold, bullet points, and code blocks
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Code block line
        if (trimmed.startsWith('```')) {
          return (
            <div key={idx} className="my-2.5 p-3.5 bg-slate-900 text-slate-100 border border-slate-800 rounded-xl font-mono text-xs overflow-x-auto shadow-xs">
              {trimmed.replace(/```[a-z]*/g, '')}
            </div>
          );
        }

        // Bullet point line
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const text = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 ml-2">
              <span className="text-indigo-600 dark:text-blue-400 font-bold">•</span>
              <span>{parseInlineMarkdown(text)}</span>
            </div>
          );
        }

        // Numbered list line
        if (/^\d+\./.test(trimmed)) {
          const match = trimmed.match(/^(\d+\.)\s*(.*)/);
          if (match) {
            return (
              <div key={idx} className="flex items-start gap-2 ml-2">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{match[1]}</span>
                <span>{parseInlineMarkdown(match[2])}</span>
              </div>
            );
          }
        }

        // Standard paragraph
        return line ? <p key={idx}>{parseInlineMarkdown(line)}</p> : <div key={idx} className="h-1" />;
      })}
    </div>
  );
};

function parseInlineMarkdown(text: string): React.ReactNode {
  // Format bold **text**
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="px-1.5 py-0.5 bg-indigo-50 dark:bg-slate-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-slate-800 rounded-md text-xs font-mono">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
