import { fileResponse } from '../../../../../lib/api/client'
import { t } from '../../../../../lib/captions/t'

// cbid: the co-borrower's ID image
const KINDS = ['id1', 'id2', 'selfie', 'cbid']

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await params
  if (!/^\d+$/.test(id) || !KINDS.includes(kind)) return new Response(t('UI_FILE_NOT_FOUND'), { status: 404 })
  return fileResponse(`/partner-file/${id}/${kind}`)
}
