import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { setCaptions } from './messages'
import { t } from '../captions/t'

// Server-only on purpose: ADMIN_API_KEY must never reach browser code.
const MAX_PAGE_SIZE = 200
const SESSION_COOKIE = 'bms_session'
const CAPTION_LIFETIME_MS = 5 * 60_000

export class ApiError extends Error {}

let captionsLoadedAt = 0

// The root layout calls this for every page, so captions refresh at most once in 5 minutes.
export async function loadCaptions() {
  if (Date.now() - captionsLoadedAt < CAPTION_LIFETIME_MS) return

  try {
    const { body } = await request('/caption-list')
    if (body?.result !== 1) return

    const rows: { CaptionCd: string; CaptionText: string; Deleted: boolean }[] = body.message
    setCaptions(Object.fromEntries(rows.filter(row => !row.Deleted).map(row => [row.CaptionCd, row.CaptionText])))
    captionsLoadedAt = Date.now()
  } catch {}
}

// After an edit, the next error reads the new wording.
export function refreshCaptions() {
  captionsLoadedAt = 0
}

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

async function callApi(path: string, init?: RequestInit) {
  const { baseUrl, adminKey } = readConfig()
  const store = await cookies()
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'x-admin-key': adminKey,
      'x-session-token': store.get(SESSION_COOKIE)?.value ?? '',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  })
}

export async function request(path: string, init?: RequestInit) {
  const response = await callApi(path, init)
  const body = await response.json().catch(() => null)
  return { response, body }
}

// Passes a stored file to the browser. The API has already checked this user's access.
export async function fileResponse(path: string) {
  try {
    const response = await callApi(path)
    if (!response.ok) return new Response(t('UI_FILE_NOT_FOUND'), { status: 404 })

    return new Response(response.body, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') ?? 'application/octet-stream',
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return new Response(t('UI_FILE_NOT_AVAILABLE'), { status: 503 })
  }
}

// A page read with a dead session goes back to login. A temporary password goes to the change step.
function checkSession(response: Response, body: { message?: unknown } | null) {
  if (response.status === 401) redirect('/login?expired=1')
  if (body?.message === 'ERR_PASSWORD_CHANGE_REQUIRED') redirect('/account/password')
}

export async function getList<T>(path: string): Promise<T[]> {
  const { response, body } = await request(path)
  checkSession(response, body)
  if (!response.ok || body?.result !== 1) {
    throw new ApiError(`API request failed: ${path} (${response.status})`)
  }
  return body.message as T[]
}

// The API answers 400 for a record that doesn't exist, so that case returns null.
export async function getRecord<T>(path: string): Promise<T | null> {
  const { response, body } = await request(path)
  checkSession(response, body)
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
  checkSession(response, body)
  if (!response.ok || body?.result !== 1) {
    throw new ApiError(`API request failed: ${path} (${response.status})`)
  }
  return body as PagedBody<T>
}

export async function send(method: 'POST' | 'PUT' | 'DELETE', path: string, payload: object) {
  const { body } = await request(path, { method, body: JSON.stringify(payload) })
  if (body?.result !== 1) await loadCaptions()
  return { ok: body?.result === 1, message: String(body?.message ?? ''), data: body }
}
