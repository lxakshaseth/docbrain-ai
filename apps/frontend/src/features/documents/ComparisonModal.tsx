import React, { useState, useEffect } from 'react';
import { X, GitCompare, Table, Loader2 } from 'lucide-react';
import { fetchApi } from '../../lib/api-client';
import type { IComparisonResult } from '@pdf-chatbot/shared';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDocIds: string[];
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  selectedDocIds,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [comparison, setComparison] = useState<IComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && selectedDocIds.length >= 2) {
      setLoading(true);
      setError(null);
      fetchApi<IComparisonResult>('/documents/compare', {
        method: 'POST',
        body: JSON.stringify({ documentIds: selectedDocIds }),
      })
        .then((res) => {
          if (res.success && res.data) {
            setComparison(res.data);
          } else {
            setError(res.message || 'Failed to compare documents');
          }
        })
        .catch((err) => setError(err.message || 'Comparison error'))
        .finally(() => setLoading(false));
    }
  }, [isOpen, selectedDocIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 dark:bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl shadow-slate-900/10 dark:shadow-black/50 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-xl text-white shadow-sm">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Multi-Document Comparison Matrix</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Comparing {selectedDocIds.length} selected documents</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 overflow-auto bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400 text-sm">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-500" />
              <span>Analyzing and synthesizing document matrix...</span>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center text-red-600 dark:text-red-400 text-sm">{error}</div>
          ) : comparison ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl space-y-1 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Synthesis Overview</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{comparison.summary}</p>
              </div>

              {/* Comparison Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-3 font-semibold text-emerald-700 dark:text-emerald-400 w-1/4">Dimension / Feature</th>
                      {comparison.headers?.map((h, i) => (
                        <th key={h.docId || i} className="p-3 font-semibold text-slate-800 dark:text-slate-200 border-l border-slate-200 dark:border-slate-800">
                          {h.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/50">
                    {comparison.rows?.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-colors">
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-300 bg-slate-50/60 dark:bg-slate-950/40">{row.feature}</td>
                        {comparison.headers?.map((h, hIdx) => (
                          <td key={hIdx} className="p-3 text-slate-600 dark:text-slate-400 border-l border-slate-200 dark:border-slate-800 leading-relaxed">
                            {row[h.docId] || row[`doc_${hIdx + 1}`] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
