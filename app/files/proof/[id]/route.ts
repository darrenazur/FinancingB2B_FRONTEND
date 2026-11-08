import { fileResponse } from '../../../../lib/api/client'
import { t } from '../../../../lib/captions/t'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^\d+$/.test(id)) return new Response(t('UI_FILE_NOT_FOUND'), { status: 404 })
  return fileResponse(`/payment-proof/${id}`)
}
