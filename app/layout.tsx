import type { Metadata } from 'next'
import './globals.css'
import DashboardShell from '../components/dashboard/DashboardShell'

export const metadata: Metadata = {
  title: 'NexusBank Dashboard',
  description: 'Banking dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  )
}
