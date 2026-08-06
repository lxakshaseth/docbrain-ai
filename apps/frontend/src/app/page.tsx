'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { AuthModal } from '../features/auth/AuthModal';
import { DocumentUpload } from '../features/documents/DocumentUpload';
import { DocumentList } from '../features/documents/DocumentList';
import { ConversationList } from '../features/chat/ConversationList';
import { ChatBox } from '../features/chat/ChatBox';
import { fetchApi } from '../lib/api-client';
import { Cpu, LogIn, Menu, X, Sparkles, Layers, Clock, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { IUser } from '@pdf-chatbot/shared';
import { UserProfileDropdown } from '../features/auth/UserProfileDropdown';
import { GuestLandingHero } from '../features/auth/GuestLandingHero';
import { useThemeStore } from '../store/useThemeStore';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export default function Home() {
  const { user, token, setAuth, logout, setAuthModalOpen, initAuth } = useAuthStore();
  const { initTheme } = useThemeStore();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'documents' | 'history'>('documents');
  const [mounted, setMounted] = useState(false);

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
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-250" suppressHydrationWarning>
      {/* Auth Modal */}
      <AuthModal />

      {/* Main Header Bar */}
      <header className="relative z-50 h-14 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between shrink-0 transition-colors duration-250" suppressHydrationWarning>
        <div className="flex items-center gap-3">
          {user && (
            <>
              {/* Mobile Drawer Trigger */}
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
                title="Toggle Sidebar"
                suppressHydrationWarning
              >
                {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Desktop Sidebar Toggle */}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden md:flex p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
            </>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:to-indigo-300">
                DocBrain AI
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">Intelligent PDF Knowledge Assistant</p>
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
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700/80 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                suppressHydrationWarning
              >
                <LogIn className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Sign In
              </button>
              <button
                onClick={() => setAuthModalOpen(true, 'register')}
                className="px-4 py-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-semibold text-xs text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
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
        <div className="flex-1 flex p-3 gap-3 overflow-hidden relative">
          {/* Left Sidebar (Collapsible Desktop & Mobile Drawer) */}
          <aside
            className={`fixed md:relative inset-y-0 left-0 z-40 w-72 flex flex-col gap-3 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3 shadow-xs transition-all duration-300 ${
              isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
            } ${isSidebarCollapsed ? 'md:hidden' : 'md:flex'}`}
          >
            {/* Primary Action Button: Compact PDF Upload */}
            <DocumentUpload compact />

            {/* Segmented Control Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-xs font-medium shrink-0">
              <button
                onClick={() => setActiveTab('documents')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
                  activeTab === 'documents'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Documents
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> History
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'documents' ? (
                <DocumentList />
              ) : (
                <ConversationList />
              )}
            </div>
          </aside>

          {/* Backdrop for mobile drawer */}
          {isMobileSidebarOpen && (
            <div
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs md:hidden"
            />
          )}

          {/* Main Content Area (Chat Canvas) */}
          <main className="flex-1 h-full overflow-hidden min-w-0">
            <ChatBox />
          </main>
        </div>
      ) : (
        <GuestLandingHero />
      )}
    </div>
  );
}

