'use client'

import { FormEvent, startTransition, useActionState, useState } from 'react'
import { login, LoginState } from '../app/login/actions'
import { Field, INPUT } from './forms/FormDialog'

const INITIAL: LoginState = { error: null }

export default function LoginForm({ expired }: { expired: boolean }) {
  const [state, formAction, pending] = useActionState(login, INITIAL)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(() => formAction(formData))
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-9">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-lg font-bold text-white">B</div>
        <span className="text-xl font-semibold tracking-tight text-ink">BankingMS</span>
      </div>

      <h1 className="text-3xl font-semibold tracking-tight text-ink">Sign in</h1>
      {expired && !state.error && <p className="mt-3 text-base text-body">Your session ended. Sign in again.</p>}

      <form onSubmit={submit} className="mt-7 flex flex-col gap-5">
        <Field label="Username">
          <input
            name="username"
            required
            autoFocus
            autoComplete="username"
            value={username}
            onChange={event => setUsername(event.target.value)}
            className={INPUT}
          />
        </Field>
        <Field label="Password">
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            className={INPUT}
          />
        </Field>

        {state.error && <p role="alert" className="text-base text-bad">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-white hover:bg-accent-strong disabled:opacity-60"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
