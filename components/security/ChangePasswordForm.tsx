'use client'

import { FormEvent, startTransition, useActionState } from 'react'
import { changePassword } from '../../app/config/security/actions'
import { SaveState } from '../../lib/config/resources'
import { Field, INPUT, useFields } from '../forms/FormDialog'
import { t } from '../../lib/captions/t'

const INITIAL: SaveState = { ok: false, error: null }
const MIN_PASSWORD_LENGTH = 12

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, INITIAL)
  const { field } = useFields({ CurrentPassword: '', NewPassword: '', ConfirmPassword: '' })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(() => formAction(formData))
  }

  return (
    <form onSubmit={submit} className="flex max-w-lg flex-col gap-5 rounded-2xl border border-line bg-surface p-8">
      <Field label={t('UI_CURRENT_PASSWORD')}>
        <input {...field('CurrentPassword')} type="password" required autoComplete="current-password" className={INPUT} />
      </Field>
      <Field label={t('UI_NEW_PASSWORD')} hint={t('UI_AT_LEAST_CHARACTERS', { MIN_PASSWORD_LENGTH })}>
        <input
          {...field('NewPassword')}
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={200}
          autoComplete="new-password"
          className={INPUT}
        />
      </Field>
      <Field label={t('UI_TYPE_THE_NEW_PASSWORD_AGAIN')}>
        <input
          {...field('ConfirmPassword')}
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={200}
          autoComplete="new-password"
          className={INPUT}
        />
      </Field>

      {state.error && <p role="alert" className="text-base text-bad">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-end rounded-xl bg-accent px-6 py-3 text-base font-medium text-white hover:bg-accent-strong disabled:opacity-60"
      >
        {pending ? t('UI_SAVING') : t('UI_SAVE')}
      </button>
    </form>
  )
}
