import Link from 'next/link'
import { redirect } from 'next/navigation'
import PageHeader from '../../../components/PageHeader'
import UsersTable from '../../../components/security/UsersTable'
import { getRoles, getUsers } from '../../../lib/api/security'
import { getCurrentUser } from '../../../lib/api/session'
import { can } from '../../../lib/permissions'
import { t } from '../../../lib/captions/t'

export default async function UsersPage() {
  const permissions = (await getCurrentUser())?.permissions ?? []
  if (!can(permissions, 'user.manage')) redirect('/dashboard')

  const [users, roles] = await Promise.all([getUsers(), getRoles()])

  return (
    <>
      <Link href="/config" className="mb-4 inline-block text-base font-medium text-accent-strong hover:underline">
        {t('UI_CONFIGURATION')}
      </Link>
      <PageHeader title={t('UI_USERS')} description={t('UI_SECURITY_PEOPLE_WHO_CAN_SIGN_IN_AND_THE_ROLE_OF_EACH')} />
      <UsersTable users={users} roles={roles} />
    </>
  )
}
