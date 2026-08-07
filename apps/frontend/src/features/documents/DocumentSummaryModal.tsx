import React, { useState, useEffect } from 'react';
import { X, Sparkles, Brain, ListChecks, Tags, Network, Loader2 } from 'lucide-react';
import { fetchApi } from '../../lib/api-client';
import type { IDocumentSummary } from '@pdf-chatbot/shared';
import { MindMapVisualizer } from '../../components/MindMapVisualizer';

interface DocumentSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string | null;
  documentTitle: string;
}

export const DocumentSummaryModal: React.FC<DocumentSummaryModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'mindmap' | 'entities'>('summary');
  const [loading, setLoading] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<IDocumentSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && documentId) {
      setLoading(true);
      setError(null);
      fetchApi<IDocumentSummary>(`/documents/${documentId}/summary`)
        .then((res) => {
          if (res.success && res.data) {
            setSummaryData(res.data);
          } else {
            setError(res.message || 'Failed to load summary');
          }
        })
        .catch((err) => {
          setError(err.message || 'Failed to fetch summary');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, documentId]);

  if (!isOpen || !documentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Document Intelligence</h3>
              <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">{documentTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 gap-4 shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-1.5 py-3 border-b-2 transition-all ${
              activeTab === 'summary'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Executive Summary
          </button>
          <button
            onClick={() => setActiveTab('mindmap')}
            className={`flex items-center gap-1.5 py-3 border-b-2 transition-all ${
              activeTab === 'mindmap'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-4 h-4" /> Mind Map Visualizer
          </button>
          <button
            onClick={() => setActiveTab('entities')}
            className={`flex items-center gap-1.5 py-3 border-b-2 transition-all ${
              activeTab === 'entities'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tags className="w-4 h-4" /> Key Terms & Entities
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950/40 text-slate-200 flex flex-col">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400 text-sm">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span>Analyzing document & generating AI intelligence...</span>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-300 text-sm text-center p-6">
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-full text-rose-400">
                <Brain className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-white text-base">Unable to connect to AI Summary Service</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                {error.includes('fetch') ? 'Backend or AI microservice is currently starting up or offline. Make sure backend service (Port 5000) and AI service (Port 8001) are running.' : error}
              </p>
              <button
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  fetchApi<IDocumentSummary>(`/documents/${documentId}/summary`)
                    .then((res) => {
                      if (res.success && res.data) setSummaryData(res.data);
                      else setError(res.message || 'Failed to load summary');
                    })
                    .catch((err) => setError(err.message || 'Failed to fetch summary'))
                    .finally(() => setLoading(false));
                }}
                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
              >
                Retry Analysis
              </button>
            </div>
          ) : summaryData ? (
            <>
              {activeTab === 'summary' && (
                <div className="space-y-6">
                  {/* Executive Summary */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Executive Summary
                    </h4>
                    <p className="text-sm leading-relaxed text-slate-300">
                      {summaryData.executiveSummary}
                    </p>
                  </div>

                  {/* Key Takeaways */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <ListChecks className="w-3.5 h-3.5 text-indigo-400" /> Key Takeaways
                    </h4>
                    <ul className="space-y-2.5">
                      {summaryData.keyTakeaways?.map((takeaway, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 bg-slate-900/50 border border-slate-800/60 p-3 rounded-lg text-xs leading-normal"
                        >
                          <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'mindmap' && (
                <MindMapVisualizer data={summaryData.mindMap || { nodes: [], edges: [] }} />
              )}

              {activeTab === 'entities' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Core Entities & Key Terms
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {summaryData.entities?.map((entity, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-lg text-xs text-slate-200 font-medium transition-colors"
                      >
                        #{entity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
