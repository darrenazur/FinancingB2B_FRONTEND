// Screens keep their view in browser storage (search, filters, row, scroll, column order).
// It belongs to one sign-in, so the login page wipes it before anyone signs in again.
// A screen that saves a new kind of view adds its prefix here.
const PREFIXES = ['table-view:', 'table-columns:', 'page-scroll:']

export function clearSavedViews() {
  for (const name of ['sessionStorage', 'localStorage'] as const) {
    try {
      const storage = window[name]
      for (let index = storage.length - 1; index >= 0; index--) {
        const key = storage.key(index)
        if (key && PREFIXES.some(prefix => key.startsWith(prefix))) storage.removeItem(key)
      }
    } catch {
      // Storage blocked: nothing was saved to wipe.
    }
  }
}
