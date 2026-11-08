import Link from 'next/link'
import { redirect } from 'next/navigation'
import PageHeader from '../../../components/PageHeader'
import LocksTable from '../../../components/security/LocksTable'
import { getLocks } from '../../../lib/api/security'
import { getCurrentUser } from '../../../lib/api/session'
import { can } from '../../../lib/permissions'
import { t } from '../../../lib/captions/t'

export default async function LocksPage() {
  const permissions = (await getCurrentUser())?.permissions ?? []
  if (!can(permissions, 'lock.release')) redirect('/dashboard')

  return (
    <>
      <Link href="/config" className="mb-4 inline-block text-base font-medium text-accent-strong hover:underline">
        {t('UI_CONFIGURATION')}
      </Link>
      <PageHeader title={t('UI_LOCKS')} description={t('UI_SECURITY_RECORDS_BEING_EDITED_NOW_RELEASE_ONE_THAT_IS')} />
      <LocksTable locks={await getLocks()} />
    </>
  )
}
