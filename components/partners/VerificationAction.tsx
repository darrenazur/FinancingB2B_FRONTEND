'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { updateVerification } from '../../app/partners/actions'
import type { Partner } from '../../lib/api/financing'
import { ROW_BUTTON_NEUTRAL } from '../actions/rowButton'
import LockNotice from '../forms/LockNotice'
import { useRecordLock } from '../forms/useRecordLock'
import { t } from '../../lib/captions/t'

const FILES = [
  { kind: 'id1', label: 'UI_ID' },
  { kind: 'id2', label: 'UI_SECOND_ID' },
  { kind: 'selfie', label: 'UI_SELFIE' },
] as const

const NEXT_STEPS: Record<string, { status: string; label: string }[]> = {
  PENDING: [{ status: 'MATCHED', label: 'UI_MARK_AS_MATCHED' }, { status: 'REJECTED', label: 'UI_REJECT' }],
  MATCHED: [{ status: 'VERIFIED', label: 'UI_VERIFY' }, { status: 'REJECTED', label: 'UI_REJECT' }],
  VERIFIED: [{ status: 'REJECTED', label: 'UI_REJECT' }],
}

// A rejected partner has no step here: updating their identity details puts them back to Pending.
export default function VerificationAction({ partner }: { partner: Partner }) {
  const [open, setOpen] = useState(false)
  if (!NEXT_STEPS[partner.status]) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={ROW_BUTTON_NEUTRAL}
        aria-label={t('UI_VERIFY_2', { name: partner.name })}
      >
        {t('UI_VERIFY')}
      </button>
      {open && <VerificationDialog partner={partner} onClose={() => setOpen(false)} />}
    </>
  )
}

function VerificationDialog({ partner, onClose }: { partner: Partner; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const recordLock = useRecordLock({ type: 'PARTNER', id: partner.id })

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const move = (status: string) => {
    setError(null)
    startTransition(async () => {
      const result = await updateVerification(partner.id, status)
      if (result.ok) onClose()
      else setError(result.error)
    })
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-surface p-8 text-left text-ink shadow-xl backdrop:bg-black/30"
    >
      <h2 className="text-2xl font-semibold tracking-tight">{t('UI_VERIFY')}{' '}{partner.name}</h2>
      {recordLock.status !== 'held' ? (
        <LockNotice lock={recordLock} onClose={onClose} />
      ) : (
      <>
      <p className="mt-3 text-base text-body">
        {t('UI_CURRENT_STATUS')}{' '}{partner.status}{t('UI_CHECK_THE_ID_AND_SELFIE_BEFORE_MOVING_THIS_PARTNER')}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {FILES.map(file => (
          <div key={file.kind} className="text-sm text-muted">
            <p className="mb-1">{t(file.label)}</p>
            {partner.files[file.kind] ? (
              <a href={`/files/partner/${partner.id}/${file.kind}`} target="_blank" rel="noreferrer">
                <img
                  src={`/files/partner/${partner.id}/${file.kind}`}
                  alt={t('UI_OF', { label: file.label, name: partner.name })}
                  className="h-24 w-full rounded-xl border border-line object-cover"
                />
              </a>
            ) : (
              <p className="flex h-24 items-center justify-center rounded-xl border border-line">{t('UI_NO_FILE')}</p>
            )}
          </div>
        ))}
      </div>
      {partner.status === 'MATCHED' && !partner.hasIdNumber && (
        <p className="mt-3 text-base text-bad">{t('UI_THIS_PARTNER_HAS_NO_ID_NUMBER_SO_THEY_CANT_BE_VERIFIED')}</p>
      )}
      {error && <p role="alert" className="mt-4 text-base text-bad">{error}</p>}

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-6 py-3 text-base font-medium text-body hover:bg-elevated"
        >
          {t('UI_CANCEL')}
        </button>
        {NEXT_STEPS[partner.status].map(step => (
          <button
            key={step.status}
            type="button"
            disabled={pending || (step.status === 'VERIFIED' && !partner.hasIdNumber)}
            onClick={() => move(step.status)}
            className={[
              'rounded-xl px-6 py-3 text-base font-medium text-white disabled:opacity-60',
              step.status === 'REJECTED' ? 'bg-bad hover:opacity-90' : 'bg-accent hover:bg-accent-strong',
            ].join(' ')}
          >
            {t(step.label)}
          </button>
        ))}
      </div>
      </>
      )}
    </dialog>
  )
}
