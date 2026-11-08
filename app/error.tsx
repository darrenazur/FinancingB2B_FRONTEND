'use client'

import { t } from '../lib/captions/t'

export default function Error({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-10">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('UI_CANT_LOAD_THIS_PAGE')}</h1>
      <p className="mt-2 text-lg text-body">{t('UI_CHECK_THAT_THE_API_IS_RUNNING_ON_PORT_8082_THEN_TRY_AGAIN')}</p>
      <button
        onClick={() => unstable_retry()}
        className="mt-6 rounded-xl bg-accent px-6 py-3 text-base font-medium text-white hover:bg-accent-hover"
      >
        {t('UI_TRY_AGAIN')}
      </button>
    </div>
  )
}
