import Link from 'next/link'
import { redirect } from 'next/navigation'
import PageHeader from '../../../components/PageHeader'
import LocksTable from '../../../components/security/LocksTable'
import { getLocks } from '../../../lib/api/security'
import { getCurrentUser } from '../../../lib/api/session'
import { can } from '../../../lib/permissions'

export default async function LocksPage() {
  const permissions = (await getCurrentUser())?.permissions ?? []
  if (!can(permissions, 'lock.release')) redirect('/dashboard')

  return (
    <>
      <Link href="/config" className="mb-4 inline-block text-base font-medium text-accent-strong hover:underline">
        ← Configuration
      </Link>
      <PageHeader title="Locks" description="Security. Records being edited now. Release one that is stuck." />
      <LocksTable locks={await getLocks()} />
    </>
  )
}
