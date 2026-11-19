import { fileResponse } from '../../../../../lib/api/client'
import { t } from '../../../../../lib/captions/t'

// A co-maker's ID picture, asked for by its loan so the loan's access rules apply
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; comakerId: string }> }) {
  const { id, comakerId } = await params
  if (!/^\d+$/.test(id) || !/^\d+$/.test(comakerId)) return new Response(t('UI_FILE_NOT_FOUND'), { status: 404 })
  return fileResponse(`/loan-comaker-file/${id}/${comakerId}`)
}
