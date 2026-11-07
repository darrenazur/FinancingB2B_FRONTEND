import { readCaption } from '../api/messages'
import { DEFAULT_CAPTIONS } from './defaults'

// Screens and server code read every label here. The CAPTION table wins, and the built-in wording
// answers when the API is down or a caption was deleted. Text that isn't a code comes back as it is.
export function t(code: string, values?: Record<string, unknown>): string {
  const text = readCaption(code) ?? DEFAULT_CAPTIONS[code] ?? code
  if (!values) return text

  return text.replace(/\{(\w+)\}/g, (placeholder, name) => {
    if (!(name in values)) return placeholder
    const value = String(values[name] ?? '')
    return value.startsWith('UI_') ? t(value) : value
  })
}
