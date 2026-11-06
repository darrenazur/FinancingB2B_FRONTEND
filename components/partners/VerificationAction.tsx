'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { updateVerification } from '../../app/partners/actions'
import type { Partner } from '../../lib/api/financing'
import { ROW_BUTTON_NEUTRAL } from '../actions/rowButton'
import LockNotice from '../forms/LockNotice'
import { useRecordLock } from '../forms/useRecordLock'

const NEXT_STEPS: Record<string, { status: string; label: string }[]> = {
  PENDING: [{ status: 'MATCHED', label: 'Mark as matched' }, { status: 'REJECTED', label: 'Reject' }],
  MATCHED: [{ status: 'VERIFIED', label: 'Verify' }, { status: 'REJECTED', label: 'Reject' }],
  VERIFIED: [{ status: 'REJECTED', label: 'Reject' }],
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
        aria-label={`Verify ${partner.name}`}
      >
        Verify
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
      <h2 className="text-2xl font-semibold tracking-tight">Verify {partner.name}</h2>
      {recordLock.status !== 'held' ? (
        <LockNotice lock={recordLock} onClose={onClose} />
      ) : (
      <>
      <p className="mt-3 text-base text-body">
        Current status: {partner.status}. Check the ID and selfie before moving this partner. Rejecting is final here.
      </p>
      {partner.status === 'MATCHED' && !partner.hasIdNumber && (
        <p className="mt-3 text-base text-bad">This partner has no ID number, so they can’t be verified. Add one through Edit.</p>
      )}
      {error && <p role="alert" className="mt-4 text-base text-bad">{error}</p>}

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-6 py-3 text-base font-medium text-body hover:bg-elevated"
        >
          Cancel
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
            {step.label}
          </button>
        ))}
      </div>
      </>
      )}
    </dialog>
  )
}
