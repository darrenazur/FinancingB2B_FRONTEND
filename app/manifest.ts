import type { MetadataRoute } from 'next'
import { t } from '../lib/captions/t'

// What a phone needs to install the site as an app: name, colors, icon, and opening full screen.
// No service worker: pages and borrower data are never kept on the phone for offline use.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: t('UI_APP_NAME'),
    short_name: t('UI_APP_NAME'),
    description: t('UI_LENDING_MANAGEMENT_SYSTEM'),
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f5f6f8',
    theme_color: '#2563eb',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
