'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useThemeStore, ThemeMode } from '../../store/useThemeStore';

export const ThemeToggle: React.FC = () => {
  const { theme, effectiveTheme, setTheme, toggleTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Light', icon: <Sun className="w-4 h-4 text-amber-500" /> },
    { mode: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4 text-indigo-400" /> },
    { mode: 'system', label: 'System', icon: <Monitor className="w-4 h-4 text-blue-400" /> },
  ];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trending Micro-Animated Quick Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={`Current theme: ${theme} (${effectiveTheme} mode)`}
        className="relative group p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all duration-300 shadow-sm flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      >
        <div className="relative w-5 h-5 flex items-center justify-center">
          {effectiveTheme === 'dark' ? (
            <Moon className="w-4 h-4 text-indigo-400 transform transition-all duration-300 rotate-0 scale-100 group-hover:rotate-12" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500 transform transition-all duration-300 rotate-0 scale-100 group-hover:rotate-45" />
          )}
        </div>
      </button>

      {/* Trending Glassmorphism Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-md z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider px-2.5 py-1 mb-1">
            Theme Mode
          </div>
          {options.map((opt) => {
            const isSelected = theme === opt.mode;
            return (
              <button
                key={opt.mode}
                onClick={() => {
                  setTheme(opt.mode);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  {opt.icon}
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
