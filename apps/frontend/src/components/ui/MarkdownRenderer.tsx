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
            <div key={idx} className="my-2 p-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-xs text-blue-600 dark:text-blue-300 overflow-x-auto">
              {trimmed.replace(/```[a-z]*/g, '')}
            </div>
          );
        }

        // Bullet point line
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const text = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 ml-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
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
      return <code key={index} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs font-mono text-indigo-600 dark:text-indigo-300">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
