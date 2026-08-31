'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
          <h2>Critical System Error</h2>
          <p>The application encountered a fatal error.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: 'black', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Hard Refresh
          </button>
        </div>
      </body>
    </html>
  );
}
