import Link from 'next/link'
import { redirect } from 'next/navigation'
import PageHeader from '../../../components/PageHeader'
import UsersTable from '../../../components/security/UsersTable'
import { getRoles, getUsers } from '../../../lib/api/security'
import { getCurrentUser } from '../../../lib/api/session'
import { can } from '../../../lib/permissions'

export default async function UsersPage() {
  const permissions = (await getCurrentUser())?.permissions ?? []
  if (!can(permissions, 'user.manage')) redirect('/dashboard')

  const [users, roles] = await Promise.all([getUsers(), getRoles()])

  return (
    <>
      <Link href="/config" className="mb-4 inline-block text-base font-medium text-accent-strong hover:underline">
        ← Configuration
      </Link>
      <PageHeader title="Users" description="Security. People who can sign in, and the role of each." />
      <UsersTable users={users} roles={roles} />
    </>
  )
}
