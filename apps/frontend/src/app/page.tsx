'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useDocumentStore } from '../store/useDocumentStore';
import { AuthModal } from '../features/auth/AuthModal';
import { DocumentUpload } from '../features/documents/DocumentUpload';
import { DocumentList } from '../features/documents/DocumentList';
import { ConversationList } from '../features/chat/ConversationList';
import { ChatBox } from '../features/chat/ChatBox';
import { fetchApi } from '../lib/api-client';
import { Cpu, LogIn, Menu, X, Sparkles, Layers, Clock, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import type { IUser, IDocument } from '@pdf-chatbot/shared';
import { UserProfileDropdown } from '../features/auth/UserProfileDropdown';
import { GuestLandingHero } from '../features/auth/GuestLandingHero';
import { useThemeStore } from '../store/useThemeStore';
import { ThemeToggle } from '../components/ui/ThemeToggle';

// Feature Modals mounted at root level
import { PdfViewerModal } from '../components/PdfViewerModal';
import { DocumentSummaryModal } from '../features/documents/DocumentSummaryModal';
import { StudyHubModal } from '../features/study/StudyHubModal';
import { ShareModal } from '../features/documents/ShareModal';
import { ComparisonModal } from '../features/documents/ComparisonModal';

export default function Home() {
  const { user, token, setAuth, logout, setAuthModalOpen, initAuth } = useAuthStore();
  const { activeDocument } = useDocumentStore();
  const { initTheme } = useThemeStore();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'documents' | 'history'>('documents');
  const [mounted, setMounted] = useState(false);

  // Root Modal State
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [pdfViewerPage, setPdfViewerPage] = useState(1);

  const [summaryDoc, setSummaryDoc] = useState<IDocument | null>(null);
  const [studyDoc, setStudyDoc] = useState<IDocument | null>(null);
  const [shareDoc, setShareDoc] = useState<IDocument | null>(null);
  const [compareDocIds, setCompareDocIds] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    initAuth();
    initTheme();
  }, []);

  useEffect(() => {
    if (token && !user) {
      fetchApi<IUser>('/auth/me')
        .then((res) => {
          if (res.success && res.data) {
            setAuth(res.data, token);
          }
        })
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400 font-sans text-sm">
        Loading DocBrain AI...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#f4f5f7] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-250" suppressHydrationWarning>
      {/* Root Feature Modals */}
      <AuthModal />

      {isPdfViewerOpen && (
        <PdfViewerModal
          isOpen={isPdfViewerOpen}
          onClose={() => setIsPdfViewerOpen(false)}
          documentId={activeDocument?.id || null}
          documentTitle={activeDocument?.title || 'Document'}
          initialPage={pdfViewerPage}
        />
      )}

      {summaryDoc && (
        <DocumentSummaryModal
          isOpen={!!summaryDoc}
          onClose={() => setSummaryDoc(null)}
          documentId={summaryDoc?.id || null}
          documentTitle={summaryDoc?.title || ''}
        />
      )}

      {studyDoc && (
        <StudyHubModal
          isOpen={!!studyDoc}
          onClose={() => setStudyDoc(null)}
          documentId={studyDoc?.id || null}
          documentTitle={studyDoc?.title || ''}
        />
      )}

      {shareDoc && (
        <ShareModal
          isOpen={!!shareDoc}
          onClose={() => setShareDoc(null)}
          document={shareDoc}
        />
      )}

      {compareDocIds.length >= 2 && (
        <ComparisonModal
          isOpen={compareDocIds.length >= 2}
          onClose={() => setCompareDocIds([])}
          selectedDocIds={compareDocIds}
        />
      )}

      {/* Main Header Bar */}
      <header className="relative z-30 h-14 border-b border-[#e2e4e9] dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between shrink-0 shadow-2xs transition-colors duration-250" suppressHydrationWarning>
        <div className="flex items-center gap-3">
          {user && (
            <>
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="md:hidden p-1.5 text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
                title="Toggle Sidebar"
                suppressHydrationWarning
              >
                {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden md:flex p-1.5 text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
            </>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-blue-600 flex items-center justify-center shadow-sm shadow-indigo-500/25">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 dark:from-blue-400 dark:to-indigo-300">
                DocBrain AI
              </h1>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 hidden sm:block font-semibold">Intelligent PDF Knowledge Assistant</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <UserProfileDropdown />
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuthModalOpen(true, 'login')}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-200 border border-[#e2e4e9] dark:border-slate-700/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                suppressHydrationWarning
              >
                <LogIn className="w-3.5 h-3.5 text-indigo-600 dark:text-blue-400" /> Sign In
              </button>
              <button
                onClick={() => setAuthModalOpen(true, 'register')}
                className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 font-bold text-xs text-white rounded-xl shadow-sm shadow-indigo-500/25 transition-all flex items-center gap-1.5"
                suppressHydrationWarning
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Get Started
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace View */}
      {user ? (
        <div className="flex-1 flex p-3 md:p-4 gap-3 md:gap-4 overflow-hidden relative">
          {/* Left Sidebar */}
          <aside
            className={`fixed md:relative inset-y-0 left-0 z-20 w-72 flex flex-col gap-3 overflow-hidden bg-white dark:bg-slate-900 border border-[#e2e4e9] dark:border-slate-800 rounded-3xl p-3.5 shadow-sm shadow-slate-200/60 backdrop-blur-xl transition-all duration-300 ${
              isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
            } ${isSidebarCollapsed ? 'md:hidden' : 'md:flex'}`}
          >
            <DocumentUpload compact />

            <div className="grid grid-cols-2 p-1 bg-[#e9ecef] dark:bg-slate-950 rounded-2xl border border-[#dbe0e6] dark:border-slate-800/80 text-xs font-medium shrink-0">
              <button
                onClick={() => setActiveTab('documents')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl transition-all ${
                  activeTab === 'documents'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs border border-[#dbe0e6] dark:border-slate-800 font-extrabold'
                    : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-bold'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600" /> Documents
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl transition-all ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs border border-[#dbe0e6] dark:border-slate-800 font-extrabold'
                    : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-bold'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-indigo-600" /> History
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              {activeTab === 'documents' ? (
                <DocumentList
                  onOpenSummary={(doc) => setSummaryDoc(doc)}
                  onOpenStudy={(doc) => setStudyDoc(doc)}
                  onOpenShare={(doc) => setShareDoc(doc)}
                  onOpenCompare={(ids) => setCompareDocIds(ids)}
                />
              ) : (
                <ConversationList />
              )}
            </div>
          </aside>

          {/* Backdrop for mobile drawer */}
          {isMobileSidebarOpen && (
            <div
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 z-10 bg-slate-900/35 backdrop-blur-xs md:hidden"
            />
          )}

          {/* Main Content Area (Chat Canvas) */}
          <main className="flex-1 h-full overflow-hidden min-w-0">
            <ChatBox
              onOpenPdfViewer={(page) => {
                setPdfViewerPage(page || 1);
                setIsPdfViewerOpen(true);
              }}
              onOpenSummary={(doc) => setSummaryDoc(doc)}
              onOpenStudy={(doc) => setStudyDoc(doc)}
              onOpenShare={(doc) => setShareDoc(doc)}
            />
          </main>
        </div>
      ) : (
        <GuestLandingHero />
      )}
    </div>
  );
}
