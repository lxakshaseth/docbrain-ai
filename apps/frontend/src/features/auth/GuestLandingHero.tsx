'use client';

import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import {
  FileText,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  LogIn,
  CheckCircle2,
  Cpu,
  BookOpen,
  MessageSquare,
  Search
} from 'lucide-react';

export const GuestLandingHero: React.FC = () => {
  const { setAuthModalOpen } = useAuthStore();

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-4 md:p-8 flex flex-col items-center justify-start space-y-12 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Top Hero Section */}
      <div className="text-center space-y-6 max-w-3xl pt-4">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span>Full-Stack RAG Engine • Express & Python FastAPI</span>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Chat with Any PDF Knowledge Base using{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
            Grounded AI Insights
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Upload complex technical documents, research papers, or legal contracts. Extract instant ground-truth answers with precise page-level citations and semantic vector search.
        </p>

        {/* Call to Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setAuthModalOpen(true, 'register')}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => setAuthModalOpen(true, 'login')}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-200 font-semibold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4 text-blue-400" />
            <span>Sign In to Account</span>
          </button>
        </div>

        {/* Trust Badges */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Page-Level Citations
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Vector Chunking & Embeddings
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Zero Hallucination Grounding
          </span>
        </div>
      </div>

      {/* Feature Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full pt-4">
        {/* Card 1 */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/40 rounded-2xl space-y-3 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">Smart PDF Ingestion</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Automatically parses multi-page PDFs into optimal semantic text chunks with vector embeddings.
          </p>
        </div>

        {/* Card 2 */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl space-y-3 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">Hybrid Vector Search</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Combines dense semantic vector retrieval with keyword search for ultra-fast query resolution.
          </p>
        </div>

        {/* Card 3 */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/40 rounded-2xl space-y-3 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">Verified Page Citations</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every response includes exact page numbers, snippet text, and relevance score badges.
          </p>
        </div>

        {/* Card 4 */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl space-y-3 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">Private & Secure</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Isolated vector collections per user session with encrypted storage and token auth.
          </p>
        </div>
      </div>

      {/* Interactive Mock Preview Card */}
      <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Mock Header */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Interactive Demo Canvas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-800 inline-block" />
            <span className="w-3 h-3 rounded-full bg-slate-800 inline-block" />
            <span className="w-3 h-3 rounded-full bg-slate-800 inline-block" />
          </div>
        </div>

        {/* Mock Content Canvas */}
        <div className="p-6 space-y-4 bg-slate-950/50">
          {/* User Query */}
          <div className="flex justify-end">
            <div className="bg-blue-600 text-white rounded-2xl px-4 py-2.5 text-xs max-w-lg shadow-md">
              What are the key performance metrics and SLAs specified in Section 4 of the agreement?
            </div>
          </div>

          {/* AI Response with Citation */}
          <div className="flex justify-start items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-200 space-y-3 max-w-xl">
              <p>
                Based on Section 4.2 of the agreement, the required system availability target is set at <strong>99.9% uptime</strong> per calendar month with a maximum latency under 200ms.
              </p>

              {/* Source Citation Pill */}
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-blue-400 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Page 14 • Section 4.2
                  </span>
                  <span className="text-emerald-400 font-mono">98% Match</span>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  "...Service Provider guarantees 99.9% monthly availability for all vector search APIs..."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mock Input Bar CTA */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400">Sign in to start querying your own PDF files...</span>
          <button
            onClick={() => setAuthModalOpen(true, 'login')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Sign In Now
          </button>
        </div>
      </div>
    </div>
  );
};
