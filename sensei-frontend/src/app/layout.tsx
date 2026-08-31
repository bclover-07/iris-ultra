import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import '../../dark.css';
import Providers from './providers';
import CustomCursor from '@/components/ui/CustomCursor';

export const metadata: Metadata = {
  title: 'Sensei — AI-Powered Adaptive Learning Platform',
  description: 'Next-generation AI-powered adaptive learning ecosystem with gesture-based interaction, LangGraph agents, gamification, and 3D immersion.',
  keywords: ['AI', 'learning', 'education', 'adaptive', 'sensei', 'gesture', 'gamification'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bangers&family=Cinzel:wght@400;500;600;700;800;900&family=Cinzel+Decorative:wght@400;700;900&family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&family=Fredoka:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400&family=Nunito+Sans:wght@300;400;600;700;800&family=Orbitron:wght@400;500;600;700;800;900&family=Patrick+Hand&family=Permanent+Marker&family=Rajdhani:wght@400;500;600;700&family=Raleway:wght@300;400;500;600;700;800&family=Share+Tech+Mono&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased dark:bg-slate-900 dark:text-slate-200 transition-colors duration-300">
        <Providers>
          <CustomCursor />
          {children}
          <div id="google_translate_element" style={{ display: 'none' }}></div>
          <Script id="google-translate-init" strategy="afterInteractive">
            {`
              function googleTranslateElementInit() {
                new window.google.translate.TranslateElement({
                  pageLanguage: 'en',
                  autoDisplay: false
                }, 'google_translate_element');
              }
            `}
          </Script>
          <Script src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" strategy="afterInteractive" />
        </Providers>
      </body>
    </html>
  );
}
