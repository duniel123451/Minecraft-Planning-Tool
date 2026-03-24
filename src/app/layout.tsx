import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { AppShell } from '@/components/layout/AppShell'
import './globals.css'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'ATM10 Tracker — Alina\'s Quest & Item Planner',
  description: 'Quest-, Bau- und Item-Tracking für All the Mods 10',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className={`${geist.variable} h-full`}>
      <body className="h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
