import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import DashboardShell from '../components/dashboard/DashboardShell'
import CaptionProvider from '../components/CaptionProvider'
import { loadCaptions } from '../lib/api/client'
import { allCaptions } from '../lib/api/messages'
import { getCurrentUser } from '../lib/api/session'
import { t } from '../lib/captions/t'

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  await loadCaptions()
  return { title: t('UI_BANKINGMS'), description: t('UI_LENDING_MANAGEMENT_SYSTEM') }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await loadCaptions()
  const user = await getCurrentUser()

  return (
    <html lang="en">
      <body className={inter.className}>
        <CaptionProvider captions={allCaptions()}>
          <DashboardShell user={user}>{children}</DashboardShell>
        </CaptionProvider>
      </body>
    </html>
  )
}
