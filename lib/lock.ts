export interface LockTarget {
  type: string
  id: number
}

// The API names each Configuration list after its path: 'term-type' locks as 'TERMTYPE'.
export const configLock = (path: string, id: number): LockTarget => ({ type: path.replaceAll('-', '').toUpperCase(), id })
