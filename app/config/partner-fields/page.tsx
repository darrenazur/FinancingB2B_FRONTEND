import Link from 'next/link'
import { redirect } from 'next/navigation'
import PageHeader from '../../../components/PageHeader'
import PartnerFieldsForm from '../../../components/config/PartnerFieldsForm'
import { getPartnerFieldRules } from '../../../lib/api/financing'
import { getCurrentUser } from '../../../lib/api/session'
import { can } from '../../../lib/permissions'
import { t } from '../../../lib/captions/t'

export default async function PartnerFieldsPage() {
  const permissions = (await getCurrentUser())?.permissions ?? []
  if (!can(permissions, 'config.view')) redirect('/dashboard')

  const rules = await getPartnerFieldRules()

  return (
    <>
      <Link href="/config" className="mb-4 inline-block text-base font-medium text-accent-strong hover:underline">
        {t('UI_CONFIGURATION')}
      </Link>
      <PageHeader title={t('UI_PARTNER_FIELDS')} description={t('UI_PARTNER_FIELDS_DESCRIPTION')} />
      <PartnerFieldsForm rules={rules} canEdit={can(permissions, 'config.edit')} />
    </>
  )
}
