'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Send, Sparkles, Eye, Loader2, Bot, User, BookOpen } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api-client';

interface PublicDocument {
  _id: string;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  summaryData?: any;
}

interface Message {
  sender: 'user' | 'bot';
  text: string;
  sources?: any[];
}

export default function PublicSharePage() {
  const params = useParams();
  const token = params?.token as string;

  const [document, setDocument] = useState<PublicDocument | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: 'Hello! I am your AI Assistant for this document. Ask me anything about its contents!',
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'pdf' | 'summary'>('chat');

  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE_URL}/documents/public/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setDocument(data.data);
        } else {
          setError(data.message || 'Shared document not found or link has expired.');
        }
      })
      .catch((err) => {
        setError('Failed to connect to server. Please try again later.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const userQuery = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userQuery }]);
    setIsSending(true);

    try {
      const res = await fetch(`${API_BASE_URL}/documents/public/${token}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: data.data.answer || 'No response generated.',
            sources: data.data.sources || [],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: 'Sorry, I encountered an error processing your request.' },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Unable to communicate with the server.' },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-slate-400 text-sm">Loading shared document...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Access Error</h2>
          <p className="text-sm text-slate-400">{error || 'Document not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">{document.title}</h1>
            <p className="text-xs text-slate-400">Shared Public Document • Read-Only Mode</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              activeTab === 'chat' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            AI Chat
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              activeTab === 'pdf' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            View Document
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col max-w-4xl mx-auto p-4">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 p-2 scrollbar-thin">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-blue-400" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                </div>
              ))}
              {isSending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-blue-400 animate-pulse" />
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-bl-none text-slate-400 text-xs flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    Analyzing document...
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="pt-3">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about this document..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isSending}
                  className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-lg transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'pdf' && (
          <div className="w-full h-full p-4">
            <iframe
              src={`${API_BASE_URL}/documents/public/${token}/file`}
              className="w-full h-full rounded-xl border border-slate-800 bg-slate-900"
              title="Shared Document Viewer"
            />
          </div>
        )}
      </main>
    </div>
  );
}
