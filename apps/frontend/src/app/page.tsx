'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { AuthModal } from '../features/auth/AuthModal';
import { DocumentUpload } from '../features/documents/DocumentUpload';
import { DocumentList } from '../features/documents/DocumentList';
import { ChatBox } from '../features/chat/ChatBox';
import { fetchApi } from '../lib/api-client';
import { Badge } from '../components/ui/Badge';
import { Cpu, LogIn, LogOut, User, Menu, X, ShieldCheck } from 'lucide-react';
import { IUser } from '@pdf-chatbot/shared';

export default function Home() {
  const { user, token, setAuth, logout, setAuthModalOpen, initAuth } = useAuthStore();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initAuth();
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
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400 font-mono text-sm">
        Loading PDF Knowledge Base AI Chatbot...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden" suppressHydrationWarning>
      {/* Auth Modal */}
      <AuthModal />

      {/* Header Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-4 md:px-6 flex items-center justify-between shrink-0" suppressHydrationWarning>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white"
            title="Toggle Sidebar"
            suppressHydrationWarning
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
              PDF Knowledge Base AI Chatbot
            </h1>
            <p className="text-[10px] text-slate-400 hidden sm:block">Full Stack RAG Engine • Express & Python FastAPI</p>
          </div>
        </div>

        <div>
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-lg">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-medium text-slate-200">{user.name}</span>
                {user.role === 'admin' ? (
                  <Badge variant="completed" className="ml-1 uppercase text-[9px] flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5" /> Admin
                  </Badge>
                ) : (
                  <Badge variant="default" className="ml-1 uppercase text-[9px]">
                    User
                  </Badge>
                )}
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                title="Logout"
                suppressHydrationWarning
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-semibold text-xs text-white rounded-lg shadow-md transition-all"
              suppressHydrationWarning
            >
              <LogIn className="w-4 h-4" /> Sign In / Register
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 p-4 gap-4 overflow-hidden relative">
        {/* Left Sidebar (Desktop & Mobile Drawer) */}
        <aside
          className={`fixed md:relative inset-y-0 left-0 z-40 w-80 md:w-auto md:col-span-4 lg:col-span-3 flex flex-col gap-4 overflow-hidden bg-slate-950 md:bg-transparent p-4 md:p-0 transition-transform duration-300 ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <DocumentUpload />
          <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl p-4 overflow-hidden flex flex-col">
            <DocumentList />
          </div>
        </aside>

        {/* Backdrop for mobile drawer */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/60 md:hidden"
          />
        )}

        {/* Main Content Area (Chat Canvas) */}
        <main className="md:col-span-8 lg:col-span-9 h-full overflow-hidden">
          <ChatBox />
        </main>
      </div>
    </div>
  );
}
