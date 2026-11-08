import 'server-only'
import { cookies } from 'next/headers'
import type { Theme } from '../components/ThemeSwitch'

// The theme chosen in this browser. No choice follows the device setting.
export async function readTheme(): Promise<Theme> {
  const saved = (await cookies()).get('theme')?.value
  return saved === 'light' || saved === 'dark' ? saved : 'system'
}
