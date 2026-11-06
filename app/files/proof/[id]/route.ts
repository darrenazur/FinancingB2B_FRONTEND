import { fileResponse } from '../../../../lib/api/client'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^\d+$/.test(id)) return new Response('File not found', { status: 404 })
  return fileResponse(`/payment-proof/${id}`)
}
