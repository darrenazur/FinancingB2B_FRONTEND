import Link from 'next/link'
import { redirect } from 'next/navigation'
import PageHeader from '../../../components/PageHeader'
import RolesTable from '../../../components/security/RolesTable'
import { getPermissions, getRoles } from '../../../lib/api/security'
import { getCurrentUser } from '../../../lib/api/session'
import { can } from '../../../lib/permissions'
import { t } from '../../../lib/captions/t'

export default async function RolesPage() {
  const permissions = (await getCurrentUser())?.permissions ?? []
  if (!can(permissions, 'role.manage')) redirect('/dashboard')

  const [roles, catalog] = await Promise.all([getRoles(), getPermissions()])

  return (
    <>
      <Link href="/config" className="mb-4 inline-block text-base font-medium text-accent-strong hover:underline">
        {t('UI_CONFIGURATION')}
      </Link>
      <PageHeader title={t('UI_ROLES')} description={t('UI_SECURITY_WHAT_EACH_ROLE_CAN_DO_AND_WHICH_RECORDS_IT_SEES')} />
      <RolesTable roles={roles} permissions={catalog} />
    </>
  )
}
