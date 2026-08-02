import React from 'react';
import { Skeleton } from '../../components/ui/Skeleton';

export const DocumentListSkeleton: React.FC = () => {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3 w-full">
            <Skeleton className="w-5 h-5 rounded" />
            <div className="space-y-1.5 w-full max-w-[140px]">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
