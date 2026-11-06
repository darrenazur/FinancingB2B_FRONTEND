'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { SaveState } from '../../lib/config/resources'
import { ROW_BUTTON_DANGER, ROW_BUTTON_NEUTRAL } from './rowButton'

const INITIAL: SaveState = { ok: false, error: null }

interface ConfirmActionProps {
  label: 'Delete' | 'Close'
  title: string
  message: string
  action: (previous: SaveState, formData: FormData) => Promise<SaveState>
}

// Delete and Close change records, so both always ask first.
export default function ConfirmAction({ label, title, message, action }: ConfirmActionProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={label === 'Delete' ? ROW_BUTTON_DANGER : ROW_BUTTON_NEUTRAL}
        aria-label={`${label}: ${title}`}
      >
        {label}
      </button>
      {open && (
        <ConfirmDialog label={label} title={title} message={message} action={action} onDone={() => setOpen(false)} />
      )}
    </>
  )
}

function ConfirmDialog({ label, title, message, action, onDone }: ConfirmActionProps & { onDone: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [state, formAction, pending] = useActionState(action, INITIAL)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  useEffect(() => {
    if (state.ok) onDone()
  }, [state.ok, onDone])

  return (
    <dialog
      ref={dialogRef}
      onClose={onDone}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-surface p-8 text-left text-ink shadow-xl backdrop:bg-black/30"
    >
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-3 text-base text-body">{message}</p>

      {state.error && <p role="alert" className="mt-4 text-base text-bad">{state.error}</p>}

      <form action={formAction} className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onDone}
          className="rounded-xl px-6 py-3 text-base font-medium text-body hover:bg-elevated"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[var(--red)] px-6 py-3 text-base font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? 'Working…' : label}
        </button>
      </form>
    </dialog>
  )
}
