import { request as callApi } from '../../../../lib/api/client'
import { readableError } from '../../../../lib/api/messages'

const KINDS = ['id', 'selfie', 'proof']

export async function POST(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params
  if (!KINDS.includes(kind)) return Response.json({ ok: false, error: readableError('ERR_FILE_NOT_VALID') })

  try {
    const { body } = await callApi(`/file-upload/${kind}`, {
      method: 'POST',
      body: await request.arrayBuffer(),
      headers: { 'Content-Type': 'application/octet-stream' },
    })
    if (body?.result === 1) return Response.json({ ok: true, key: body.message })
    return Response.json({ ok: false, error: readableError(String(body?.message ?? '')) })
  } catch {
    return Response.json({ ok: false, error: 'Can’t reach the API. Check that it is running.' })
  }
}
