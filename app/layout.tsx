import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import DashboardShell from '../components/dashboard/DashboardShell'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BankingMS',
  description: 'Lending management system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  )
}
