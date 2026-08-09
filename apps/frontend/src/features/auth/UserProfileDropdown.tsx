'use client';

import React, { useState, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useClickOutside } from '../../hooks/useClickOutside';
import { ProfileSettingsModal } from './ProfileSettingsModal';
import { AccountManagementModal } from './AccountManagementModal';
import { Badge } from '../../components/ui/Badge';
import {
  User,
  ChevronDown,
  Sliders,
  ShieldCheck,
  LogOut,
  Sparkles,
  Shield
} from 'lucide-react';

export const UserProfileDropdown: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useClickOutside(dropdownRef, () => setIsOpen(false), isOpen);

  if (!user) return null;

  const getInitials = (nameStr: string) => {
    return (
      nameStr
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U'
    );
  };

  const handleOpenProfileSettings = () => {
    setIsOpen(false);
    setIsProfileModalOpen(true);
  };

  const handleOpenAccountManagement = () => {
    setIsOpen(false);
    setIsAccountModalOpen(true);
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <>
      <div className="relative z-50 inline-block text-left" ref={dropdownRef}>
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-500/40 ${
            isOpen
              ? 'bg-slate-100 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700 shadow-xs text-slate-900 dark:text-slate-100'
              : 'bg-white dark:bg-slate-800/50 border-slate-200/90 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs'
          }`}
          aria-expanded={isOpen}
          aria-haspopup="true"
          title="User Profile Menu"
        >
          {/* Avatar Icon / Initials */}
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 font-bold text-white text-xs shadow-sm ring-1 ring-white/10 shrink-0">
            {getInitials(user.name)}
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </div>

          {/* Name & Role */}
          <div className="flex items-center gap-2 text-left hidden sm:flex">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
              {user.name}
            </span>

            {user.role === 'admin' ? (
              <Badge variant="completed" className="uppercase text-[9px] px-1.5 py-0 flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" /> Admin
              </Badge>
            ) : (
              <Badge variant="default" className="uppercase text-[9px] px-1.5 py-0">
                User
              </Badge>
            )}
          </div>

          {/* Rotating Chevron */}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
            }`}
          />
        </button>

        {/* Animated Dropdown Panel */}
        {isOpen && (
          <div
            className="absolute right-0 mt-2 w-72 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-md z-[100] overflow-hidden transform origin-top-right transition-all duration-200 animate-in fade-in zoom-in-95"
            role="menu"
            aria-orientation="vertical"
          >
            {/* User Info Header Card */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-md shrink-0">
                {getInitials(user.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                  <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="px-4 py-1.5 bg-slate-100 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" /> RAG Engine Mode
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-300">Fast Hybrid</span>
            </div>

            {/* Menu Navigation Group */}
            <div className="p-1.5 space-y-0.5">
              {/* Profile Settings */}
              <button
                onClick={handleOpenProfileSettings}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all group"
                role="menuitem"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/20 group-hover:scale-105 transition-all">
                  <Sliders className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">Profile Settings</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Personal details & preferences</div>
                </div>
              </button>

              {/* Account Management */}
              <button
                onClick={handleOpenAccountManagement}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all group"
                role="menuitem"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:bg-purple-500/20 group-hover:scale-105 transition-all">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">Account Management</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Security, quotas & roles</div>
                </div>
              </button>
            </div>

            {/* Divider */}
            <div className="my-1 border-t border-slate-200 dark:border-slate-800/80" />

            {/* Log Out Option */}
            <div className="p-1.5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/10 transition-all group"
                role="menuitem"
              >
                <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:bg-red-500/20 group-hover:scale-105 transition-all">
                  <LogOut className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">Log Out</div>
                  <div className="text-[10px] text-red-500/80 dark:text-red-400/70 font-normal">Sign out of your session</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Account Management Modal */}
      <AccountManagementModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />
    </>
  );
};
