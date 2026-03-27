import type { Metadata } from 'next'
import { Bebas_Neue, Barlow_Condensed, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const display = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
})

const body = Barlow_Condensed({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-body',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Octagon Picks — UFC Pronostics',
  description: 'Pronostique les événements UFC avec tes amis',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-octagon-950 text-white font-body antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
