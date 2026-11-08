import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import BizTable from '../../../components/business/BizTable'
import PageHeader from '../../../components/PageHeader'
import { getBizOptions, getBizRows } from '../../../lib/api/business'
import { getCurrentUser } from '../../../lib/api/session'
import { findBizResource } from '../../../lib/business/resources'
import { can } from '../../../lib/permissions'
import { t } from '../../../lib/captions/t'

export default async function BusinessResourcePage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource: key } = await params
  const resource = findBizResource(key)
  if (!resource) notFound()

  const permissions = (await getCurrentUser())?.permissions ?? []
  if (!can(permissions, 'business.view')) redirect('/dashboard')

  const [rows, options] = await Promise.all([getBizRows(resource), getBizOptions(resource.sources)])

  return (
    <>
      <Link href="/business" className="mb-4 inline-block text-base font-medium text-accent-strong hover:underline">
        {t('UI_BUSINESS')}
      </Link>
      <PageHeader title={t(resource.label)} description={t(resource.description)} />
      <BizTable resource={resource} rows={rows} options={options} canEdit={can(permissions, 'business.manage')} />
    </>
  )
}
