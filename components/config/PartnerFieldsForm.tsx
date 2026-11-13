'use client'

import { FormEvent, startTransition, useActionState, useState } from 'react'
import { savePartnerFieldRules } from '../../app/config/partner-fields/actions'
import type { PartnerFieldRule } from '../../lib/api/financing'
import type { SaveState } from '../../lib/config/resources'
import { t } from '../../lib/captions/t'

const INITIAL: SaveState = { ok: false, error: null }
const SECTIONS: { section: PartnerFieldRule['section']; label: string; always: string }[] = [
  { section: 'PARTNER', label: 'UI_PARTNER', always: 'UI_PARTNER_FIELDS_ALWAYS_REQUIRED' },
  { section: 'COBORROWER', label: 'UI_CO_BORROWER', always: 'UI_CO_BORROWER_FIELDS_ALWAYS_REQUIRED' },
]

interface PartnerFieldsFormProps {
  rules: PartnerFieldRule[]
  canEdit: boolean
}

// A Required box per field. Saving applies to new saves only: partners already on file keep what they have.
export default function PartnerFieldsForm({ rules, canEdit }: PartnerFieldsFormProps) {
  const [state, formAction, pending] = useActionState(savePartnerFieldRules, INITIAL)
  const [required, setRequired] = useState(() => new Set(rules.filter(rule => rule.required).map(rule => rule.code)))

  const toggle = (code: string, checked: boolean) =>
    setRequired(current => {
      const next = new Set(current)
      if (checked) next.add(code)
      else next.delete(code)
      return next
    })

  // Not <form action>: React resets that form after the action, which would untick boxes on an error.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(() => formAction(formData))
  }

  return (
    <form onSubmit={submit} className="flex max-w-3xl flex-col gap-8">
      {SECTIONS.map(({ section, label, always }) => (
        <section key={section} className="rounded-2xl border border-line bg-surface p-7">
          <h2 className="text-xl font-semibold tracking-tight text-ink">{t(label)}</h2>
          <p className="mt-1 text-base text-body">{t(always)}</p>
          <ul className="mt-5 divide-y divide-[var(--border)]">
            {rules.filter(rule => rule.section === section).map(rule => (
              <li key={rule.code}>
                <label className="flex items-center justify-between gap-4 py-3.5 text-base text-ink">
                  <span>{t(rule.label)}</span>
                  <span className="flex items-center gap-2.5 text-sm text-muted">
                    {t('UI_REQUIRED')}
                    <input
                      type="checkbox"
                      name="Required"
                      value={rule.code}
                      checked={required.has(rule.code)}
                      disabled={!canEdit}
                      onChange={event => toggle(rule.code, event.target.checked)}
                      className="h-5 w-5"
                    />
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {state.error && <p role="alert" className="text-base text-bad">{state.error}</p>}
      {state.ok && state.notice && <p role="status" className="text-base text-good">{state.notice}</p>}

      {canEdit && (
        <div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-accent px-6 py-3 text-base font-medium text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {pending ? t('UI_SAVING') : t('UI_SAVE')}
          </button>
        </div>
      )}
    </form>
  )
}
