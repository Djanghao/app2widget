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
      <body className={inter.className} style={{ height: '100%', margin: 0, padding: 0 }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
