import { request as callApi, loadCaptions } from '../../../../lib/api/client'
import { readableError } from '../../../../lib/api/messages'
import { t } from '../../../../lib/captions/t'

const KINDS = ['id', 'selfie', 'proof', 'note']

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
    await loadCaptions()
    return Response.json({ ok: false, error: readableError(String(body?.message ?? '')) })
  } catch {
    return Response.json({ ok: false, error: t('UI_CANT_REACH_THE_API_CHECK_THAT_IT_IS_RUNNING') })
  }
}
