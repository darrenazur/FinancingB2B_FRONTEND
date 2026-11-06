'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { SaveState } from '../../lib/config/resources'
import { LockTarget } from '../../lib/lock'
import LockNotice from '../forms/LockNotice'
import { useRecordLock } from '../forms/useRecordLock'
import { ROW_BUTTON_DANGER, ROW_BUTTON_NEUTRAL } from './rowButton'

const INITIAL: SaveState = { ok: false, error: null }
const CANCEL = 'rounded-xl px-6 py-3 text-base font-medium text-body hover:bg-elevated'

interface ConfirmActionProps {
  label: string
  title: string
  message: string
  action: (previous: SaveState, formData: FormData) => Promise<SaveState>
  // Asks for a written reason, sent as the form field "reason".
  reasonLabel?: string
  triggerClass?: string
  // The record this action changes, held while the dialog is open.
  lock?: LockTarget
}

// These actions change records, so they always ask first.
export default function ConfirmAction({ label, title, message, action, reasonLabel, triggerClass, lock }: ConfirmActionProps) {
  const [open, setOpen] = useState(false)
  const rowClass = label === 'Delete' ? ROW_BUTTON_DANGER : ROW_BUTTON_NEUTRAL

  return (
    <>
      <button onClick={() => setOpen(true)} className={triggerClass ?? rowClass} aria-label={`${label}: ${title}`}>
        {label}
      </button>
      {open && (
        <ConfirmDialog
          label={label}
          title={title}
          message={message}
          action={action}
          reasonLabel={reasonLabel}
          lock={lock}
          onDone={() => setOpen(false)}
        />
      )}
    </>
  )
}

function ConfirmDialog({ label, title, message, action, reasonLabel, lock, onDone }: ConfirmActionProps & { onDone: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [state, formAction, pending] = useActionState(action, INITIAL)
  const [reason, setReason] = useState('')
  const recordLock = useRecordLock(lock)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  useEffect(() => {
    if (state.ok && !state.notice) onDone()
  }, [state.ok, state.notice, onDone])

  return (
    <dialog
      ref={dialogRef}
      onClose={onDone}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-surface p-8 text-left text-ink shadow-xl backdrop:bg-black/30"
    >
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>

      {recordLock.status !== 'held' ? (
        <LockNotice lock={recordLock} onClose={onDone} />
      ) : state.ok && state.notice ? (
        <>
          <p role="status" className="mt-3 text-base text-body">{state.notice}</p>
          <div className="mt-6 flex justify-end">
            <button type="button" onClick={onDone} className={CANCEL}>Close</button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-base text-body">{message}</p>

          {state.error && <p role="alert" className="mt-4 text-base text-bad">{state.error}</p>}

          <form action={formAction} className="mt-6">
            {reasonLabel && (
              <label className="mb-6 flex flex-col gap-2 text-base font-medium text-body">
                {reasonLabel}
                <textarea
                  name="reason"
                  required
                  rows={3}
                  maxLength={500}
                  value={reason}
                  onChange={event => setReason(event.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-surface px-4 py-3 text-base font-normal text-ink outline-none focus:border-accent"
                />
              </label>
            )}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onDone} className={CANCEL}>Cancel</button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-[var(--red)] px-6 py-3 text-base font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                {pending ? 'Working…' : label}
              </button>
            </div>
          </form>
        </>
      )}
    </dialog>
  )
}
