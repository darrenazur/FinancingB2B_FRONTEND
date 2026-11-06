// No login yet, so this marks the source of a change. Replace with the signed-in user (#6).
export const ACTOR = 'web-admin'

// Business messages are uppercase codes. Anything else may be raw SQL text, so it stays off the screen.
export function readableError(message: string) {
  if (!/^[A-Z0-9 _]+$/.test(message)) return 'The API rejected this change.'
  const text = message.replace(/^ERR_/, '').replace(/_/g, ' ').toLowerCase()
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`
}
