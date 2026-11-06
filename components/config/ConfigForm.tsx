'use client'

import { FormEvent, startTransition, useActionState, useEffect, useRef, useState } from 'react'
import { saveConfigRecord } from '../../app/config/actions'
import { ConfigField, ConfigResource, SaveState } from '../../lib/config/resources'
import { digitsOnly } from '../forms/FormDialog'
import type { ConfigRow, FieldOption } from './ConfigTable'

const INPUT = 'w-full rounded-xl border border-[var(--border)] bg-surface px-4 py-3 text-base text-ink outline-none focus:border-accent disabled:bg-elevated disabled:text-muted'
const INITIAL: SaveState = { ok: false, error: null }

interface ConfigFormProps {
  resource: ConfigResource
  row: ConfigRow | null
  options: Record<string, FieldOption[]>
  onClose: () => void
}

export default function ConfigForm({ resource, row, options, onClose }: ConfigFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const action = saveConfigRecord.bind(null, resource.key, row?.id ?? null)
  const [state, formAction, pending] = useActionState(action, INITIAL)
  const [selected, setSelected] = useState<Record<string, string>>(() => row?.values ?? {})

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  useEffect(() => {
    if (state.ok) onClose()
  }, [state.ok, onClose])

  // Not <form action>: React resets that form after the action, which clears selects on an error.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(() => formAction(formData))
  }

  // Picking a country clears the province and city under it.
  const select = (field: ConfigField, value: string) => {
    const next = { ...selected, [field.name]: value }
    let parent = field.name
    for (const child of resource.fields) {
      if (child.parent === parent) {
        next[child.name] = ''
        parent = child.name
      }
    }
    setSelected(next)
  }

  const choicesFor = (field: ConfigField) =>
    (options[field.name] ?? []).filter(option => {
      if (option.deleted && String(option.value) !== selected[field.name]) return false
      return !field.parent || String(option.parents[field.parent]) === selected[field.parent]
    })

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-surface p-8 text-ink shadow-xl backdrop:bg-black/30"
    >
      <h2 className="text-2xl font-semibold tracking-tight">
        {row ? 'Edit' : 'Add'} {resource.label}
      </h2>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-5">
        {resource.fields.map(field => {
          const locked = Boolean(row && field.lockOnEdit)
          return (
            <label key={field.name} className="flex flex-col gap-2 text-base font-medium text-body">
              {field.label}
              {field.type === 'select' ? (
                <select
                  name={field.name}
                  required
                  value={selected[field.name] ?? ''}
                  onChange={event => select(field, event.target.value)}
                  className={INPUT}
                >
                  <option value="">Select {field.label.toLowerCase()}</option>
                  {choicesFor(field).map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  name={field.name}
                  type="text"
                  inputMode={field.type === 'number' ? 'numeric' : undefined}
                  required
                  readOnly={locked}
                  maxLength={field.exactLength ?? field.maxLength}
                  value={selected[field.name] ?? ''}
                  onChange={event => select(field, field.type === 'number' ? digitsOnly(event.target.value) : event.target.value)}
                  className={`${INPUT} ${locked ? 'bg-elevated text-muted' : ''} ${field.uppercase ? 'uppercase' : ''}`}
                />
              )}
            </label>
          )
        })}

        {state.error && <p role="alert" className="text-base text-bad">{state.error}</p>}

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-6 py-3 text-base font-medium text-body hover:bg-elevated"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-accent px-6 py-3 text-base font-medium text-white hover:bg-accent-strong disabled:opacity-60"
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
