'use client';

import React, { useEffect } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-6">
        <AlertOctagon className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        An unhandled runtime error occurred in the application interface.
      </p>
      <Button variant="gradient" onClick={() => reset()} className="flex items-center gap-2">
        <RefreshCw className="w-4 h-4" /> Try Again
      </Button>
    </div>
  );
}
