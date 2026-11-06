import 'server-only'

// Server-only on purpose: ADMIN_API_KEY must never reach browser code.
const MAX_PAGE_SIZE = 200

export class ApiError extends Error {}

interface PagedBody<T> {
  result: number
  message: T[]
  total: number
}

function readConfig() {
  const baseUrl = process.env.API_BASE_URL
  const adminKey = process.env.ADMIN_API_KEY
  if (!baseUrl || !adminKey) {
    throw new ApiError('API_BASE_URL and ADMIN_API_KEY must be set in .env.local')
  }
  return { baseUrl, adminKey }
}

async function request(path: string, init?: RequestInit) {
  const { baseUrl, adminKey } = readConfig()
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
    cache: 'no-store',
  })
  const body = await response.json().catch(() => null)
  return { response, body }
}

export async function getList<T>(path: string): Promise<T[]> {
  const { response, body } = await request(path)
  if (!response.ok || body?.result !== 1) {
    throw new ApiError(`API request failed: ${path} (${response.status})`)
  }
  return body.message as T[]
}

// The API answers 400 for a record that doesn't exist, so that case returns null.
export async function getRecord<T>(path: string): Promise<T | null> {
  const { response, body } = await request(path)
  if (response.status === 400) return null
  if (!response.ok || body?.result !== 1) {
    throw new ApiError(`API request failed: ${path} (${response.status})`)
  }
  return body.message as T
}

export async function getAllPages<T>(path: string): Promise<T[]> {
  const rows: T[] = []
  for (let page = 1; ; page++) {
    const body = await getPage<T>(path, page)
    rows.push(...body.message)
    if (body.message.length === 0 || rows.length >= body.total) return rows
  }
}

async function getPage<T>(path: string, page: number): Promise<PagedBody<T>> {
  const { response, body } = await request(`${path}?page=${page}&pageSize=${MAX_PAGE_SIZE}`)
  if (!response.ok || body?.result !== 1) {
    throw new ApiError(`API request failed: ${path} (${response.status})`)
  }
  return body as PagedBody<T>
}

export async function send(method: 'POST' | 'PUT' | 'DELETE', path: string, payload: object) {
  const { body } = await request(path, { method, body: JSON.stringify(payload) })
  return { ok: body?.result === 1, message: String(body?.message ?? ''), data: body }
}
