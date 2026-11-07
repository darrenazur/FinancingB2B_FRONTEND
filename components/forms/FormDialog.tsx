'use client'

import { ChangeEvent, FormEvent, ReactNode, startTransition, useActionState, useEffect, useRef, useState } from 'react'
import { SaveState } from '../../lib/config/resources'
import { LockTarget } from '../../lib/lock'
import LockNotice from './LockNotice'
import { useRecordLock } from './useRecordLock'
import { t } from '../../lib/captions/t'

export const INPUT = 'w-full rounded-xl border border-[var(--border)] bg-surface px-4 py-3 text-base text-ink outline-none focus:border-accent disabled:bg-elevated disabled:text-muted'

const INITIAL: SaveState = { ok: false, error: null }
const BUTTON = 'rounded-xl px-6 py-3 text-base font-medium'

type FieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

const MAX_WHOLE_DIGITS = 13

export const digitsOnly = (value: string) => value.replace(/\D/g, '')

// Keeps digits and one decimal point, within what the API accepts.
export function decimalOnly(places: number) {
  return (value: string) => {
    const [whole, ...decimals] = value.replace(/[^\d.]/g, '').split('.')
    const number = whole.slice(0, MAX_WHOLE_DIGITS)
    return decimals.length > 0 ? `${number}.${decimals.join('').slice(0, places)}` : number
  }
}

// Controlled, so an error never clears what was typed.
export function useFields<Fields extends Record<string, string>>(initial: Fields) {
  const [values, setValues] = useState(initial)
  const field = (name: keyof Fields & string, clean: (value: string) => string = value => value) => ({
    name,
    value: values[name],
    onChange: (event: ChangeEvent<FieldElement>) => {
      const value = clean(event.target.value)
      setValues(current => ({ ...current, [name]: value }))
    },
  })
  return { values, setValues, field }
}

interface FieldProps {
  label: string
  hint?: string
  children: ReactNode
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-2 text-base font-medium text-body">
      {label}
      {children}
      {hint && <span className="text-sm font-normal text-muted">{hint}</span>}
    </label>
  )
}

interface FormDialogProps {
  title: string
  action: (previous: SaveState, formData: FormData) => Promise<SaveState>
  onClose: () => void
  wide?: boolean
  // An edit holds this record while the window is open.
  lock?: LockTarget
  children: ReactNode
}

export default function FormDialog({ title, action, onClose, wide, lock, children }: FormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [state, formAction, pending] = useActionState(action, INITIAL)
  const recordLock = useRecordLock(lock)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  useEffect(() => {
    if (state.ok && !state.notice) onClose()
  }, [state.ok, state.notice, onClose])

  // Not <form action>: React resets that form after the action, which clears selects and checkboxes on an error.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(() => formAction(formData))
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={`m-auto max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl bg-surface p-8 text-left text-ink shadow-xl backdrop:bg-black/30 ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
    >
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>

      {recordLock.status !== 'held' ? (
        <LockNotice lock={recordLock} onClose={onClose} />
      ) : state.ok && state.notice ? (
        <>
          <p role="status" className="mt-4 text-base text-body">{state.notice}</p>
          <div className="mt-6 flex justify-end">
            <button type="button" onClick={onClose} className={`${BUTTON} bg-accent text-white hover:bg-accent-strong`}>
              {t('UI_CLOSE')}
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={submit} className="mt-6 flex flex-col gap-5">
          {children}

          {state.error && <p role="alert" className="text-base text-bad">{state.error}</p>}

          <div className="mt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className={`${BUTTON} text-body hover:bg-elevated`}>
              {t('UI_CANCEL')}
            </button>
            <button
              type="submit"
              disabled={pending}
              className={`${BUTTON} bg-accent text-white hover:bg-accent-strong disabled:opacity-60`}
            >
              {pending ? t('UI_SAVING') : t('UI_SAVE')}
            </button>
          </div>
        </form>
      )}
    </dialog>
  )
}
