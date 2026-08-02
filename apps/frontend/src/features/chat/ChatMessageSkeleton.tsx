import React from 'react';
import { Skeleton } from '../../components/ui/Skeleton';

export const ChatMessageSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-3 justify-start">
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
        <div className="space-y-2 max-w-md w-full">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <div className="space-y-2 max-w-md w-full flex flex-col items-end">
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      </div>
    </div>
  );
};
