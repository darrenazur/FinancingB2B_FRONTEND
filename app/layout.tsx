import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import DashboardShell from '../components/dashboard/DashboardShell'
import { getCurrentUser } from '../lib/api/session'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BankingMS',
  description: 'Lending management system',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  return (
    <html lang="en">
      <body className={inter.className}>
        <DashboardShell user={user}>{children}</DashboardShell>
      </body>
    </html>
  )
}
