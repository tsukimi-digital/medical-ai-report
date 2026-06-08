import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sonara — Medical AI Report Assistant',
  description: 'AI-assisted ultrasound report generation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  )
}
