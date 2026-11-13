import { redirect } from 'next/navigation'
import LoginForm from '../../components/LoginForm'
import ThemeSwitch from '../../components/ThemeSwitch'
import { getCurrentUser } from '../../lib/api/session'
import { readTheme } from '../../lib/theme'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const { expired } = await searchParams
  // Already signed in (the API confirms the session): skip the form.
  if (await getCurrentUser()) redirect('/dashboard')
  const theme = await readTheme()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-page px-4 py-10">
      <LoginForm expired={expired === '1'} />
      <div className="w-full max-w-60">
        <ThemeSwitch initial={theme} />
      </div>
    </main>
  )
}
