import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'completed' | 'processing' | 'failed' | 'pending' | 'default';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const baseStyle = 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border';

  const variantStyles = {
    completed: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    processing: 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse',
    failed: 'bg-red-500/10 border-red-500/30 text-red-400',
    pending: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    default: 'bg-slate-800 border-slate-700 text-slate-300',
  };

  return (
    <span className={`${baseStyle} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
