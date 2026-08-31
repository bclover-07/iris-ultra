'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState, Component, ErrorInfo, ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';


export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: 2, staleTime: 30_000, refetchOnWindowFocus: false }
    }
  }));

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
            {children}
        <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'var(--font-body)',
            borderRadius: '12px',
            border: '2px solid #2D2D2D',
            boxShadow: '3px 3px 0px #2D2D2D',
            fontSize: '0.95rem',
          }
        }}
      />
      </QueryClientProvider>
      </ThemeProvider>
  );
}
