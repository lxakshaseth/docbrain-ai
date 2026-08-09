import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 backdrop-blur-md shadow-sm shadow-slate-200/50 dark:shadow-lg transition-all ${className}`}>
      {children}
    </div>
  );
};
