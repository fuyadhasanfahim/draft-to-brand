'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

export function AdminProviders({ children }: { children: ReactNode }) {
    const [client] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30_000,
                        refetchOnWindowFocus: false,
                        retry: 1,
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={client}>
            {children}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3500,
                    style: {
                        borderRadius: '12px',
                        background: '#282a2a',
                        color: '#ffffff',
                        fontSize: '14px',
                        padding: '10px 14px',
                    },
                    success: { iconTheme: { primary: '#ff3131', secondary: '#ffffff' } },
                    error: { iconTheme: { primary: '#ff3131', secondary: '#ffffff' } },
                }}
            />
        </QueryClientProvider>
    );
}
