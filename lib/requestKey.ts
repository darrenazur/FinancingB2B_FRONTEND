// One key per form, so a double click or a retry can't save the same loan or payment twice.
export function newRequestKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}
