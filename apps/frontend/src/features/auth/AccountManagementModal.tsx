'use client';

import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { ShieldCheck, KeyRound, HardDrive, Cpu, X, Lock, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

interface AccountManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountManagementModal: React.FC<AccountManagementModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 dark:bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl shadow-slate-900/10 dark:shadow-black/50 overflow-hidden flex flex-col transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Account Management</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Security, quota limits, and system authorization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status & Plan overview */}
          <div className="p-4 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800/40 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Plan Tier:</span>
                <Badge variant="completed" className="uppercase font-bold tracking-wider text-[9px]">
                  Enterprise RAG
                </Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Full access to document indexing & hybrid search</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3" /> Active Status
              </span>
            </div>
          </div>

          {/* Account Security Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Security & Access
            </h3>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-900 dark:text-slate-200">Password</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Last changed 14 days ago</p>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Password reset link sent to registered email!')}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <KeyRound className="w-3 h-3 text-slate-500 dark:text-slate-400" /> Reset Password
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-900 dark:text-slate-200">Two-Factor Authentication (2FA)</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Secured via OTP & Session Key</p>
                </div>
                <Badge variant="completed" className="text-[9px]">
                  Enabled
                </Badge>
              </div>
            </div>
          </div>

          {/* RAG Engine Quotas */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> RAG Storage & Usage
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs">
                  <HardDrive className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Document Index
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100">12 / 50 PDFs</p>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[24%]" />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs">
                  <Cpu className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Embeddings Quota
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100">4.2k / 50k Chunks</p>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full w-[8.4%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/50 rounded-xl text-xs space-y-1 text-slate-500 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Account ID:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{user.id || 'usr_rag_88921'}</span>
            </div>
            <div className="flex justify-between">
              <span>Account Role:</span>
              <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">{user.role}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
