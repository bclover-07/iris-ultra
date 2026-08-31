'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FAFAFA] text-black p-10 text-center">
      <h1 className="font-display text-4xl mb-4 font-bold uppercase tracking-wider text-[var(--brutalist-purple,#0891B2)]">
        Oops! Something went wrong 🤖
      </h1>
      <p className="font-ui text-lg opacity-80 max-w-md mx-auto mb-8">
        We encountered an unexpected error. Don't worry, just hit refresh!
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-8 py-3 bg-[var(--brutalist-yellow,#BAE6FD)] text-black font-bold rounded-xl border-4 border-black shadow-[4px_4px_0_#000] hover:translate-y-[-2px] transition-all uppercase"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-white text-black font-bold rounded-xl border-4 border-black shadow-[4px_4px_0_#000] hover:translate-y-[-2px] transition-all uppercase"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}
