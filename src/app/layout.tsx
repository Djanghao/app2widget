import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'App2Widget - AI Widget Generator',
  description: 'Generate mobile-style widgets with AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" style={{ height: '100%' }}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          // Polyfill crypto.subtle.digest for insecure contexts (non-HTTPS)
          // Required by @codesandbox/sandpack-react
          if (typeof crypto !== 'undefined' && !crypto.subtle) {
            crypto.subtle = {
              digest: function(algo, data) {
                return new Promise(function(resolve) {
                  var hash = 0;
                  var bytes = new Uint8Array(data);
                  for (var i = 0; i < bytes.length; i++) {
                    hash = ((hash << 5) - hash + bytes[i]) | 0;
                  }
                  resolve(new Uint8Array([hash >> 24, hash >> 16, hash >> 8, hash]).buffer);
                });
              }
            };
          }
        `}} />
      </head>
      <body className={inter.className} style={{ height: '100%', margin: 0, padding: 0 }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
