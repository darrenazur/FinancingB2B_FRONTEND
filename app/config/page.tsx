import Link from 'next/link'
import { redirect } from 'next/navigation'
import PageHeader from '../../components/PageHeader'
import { getCurrentUser } from '../../lib/api/session'
import { CONFIG_RESOURCES, ConfigResource } from '../../lib/config/resources'
import { can } from '../../lib/permissions'
import { t } from '../../lib/captions/t'

const GROUPS: ConfigResource['group'][] = ['UI_REFERENCE_DATA', 'UI_MASTER_DATA']
const SECURITY = [
  { href: '/config/users', label: 'UI_USERS', description: 'UI_PEOPLE_WHO_CAN_SIGN_IN', permission: 'user.manage' },
  { href: '/config/roles', label: 'UI_ROLES', description: 'UI_WHAT_EACH_ROLE_CAN_DO', permission: 'role.manage' },
  { href: '/config/locks', label: 'UI_LOCKS', description: 'UI_RECORDS_BEING_EDITED_NOW', permission: 'lock.release' },
]
// Rules that change how other screens behave, rather than lists of values
const CONFIG_TABLES = [
  { href: '/config/partner-fields', label: 'UI_PARTNER_FIELDS', description: 'UI_PARTNER_FIELDS_DESCRIPTION' },
]

export default async function ConfigPage() {
  const permissions = (await getCurrentUser())?.permissions ?? []
  const security = SECURITY.filter(item => can(permissions, item.permission))
  const showLists = can(permissions, 'config.view')
  if (!showLists && security.length === 0) redirect('/dashboard')

  return (
    <>
      <PageHeader title={t('UI_CONFIGURATION_2')} description={t('UI_LISTS_USED_ACROSS_LOANS_AND_PARTNER_RECORDS')} />

      {security.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold tracking-tight text-ink">{t('UI_SECURITY')}</h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {security.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-line bg-surface p-7 transition-colors hover:border-accent"
              >
                <p className="text-lg font-semibold text-ink">{t(item.label)}</p>
                <p className="mt-2 text-base text-body">{t(item.description)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {showLists && GROUPS.map(group => (
        <section key={group} className="mb-10">
          <h2 className="mb-4 text-xl font-semibold tracking-tight text-ink">{t(group)}</h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {CONFIG_RESOURCES.filter(resource => resource.group === group).map(resource => (
              <Link
                key={resource.key}
                href={`/config/${resource.key}`}
                className="rounded-2xl border border-line bg-surface p-7 transition-colors hover:border-accent"
              >
                <p className="text-lg font-semibold text-ink">{t(resource.label)}</p>
                <p className="mt-1 text-base text-body">{t(resource.description)}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {showLists && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold tracking-tight text-ink">{t('UI_CONFIGURATION_TABLES')}</h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ...CONFIG_TABLES,
              ...CONFIG_RESOURCES.filter(resource => resource.group === 'UI_CONFIGURATION_TABLES')
                .map(resource => ({ href: `/config/${resource.key}`, label: resource.label, description: resource.description })),
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-line bg-surface p-7 transition-colors hover:border-accent"
              >
                <p className="text-lg font-semibold text-ink">{t(item.label)}</p>
                <p className="mt-1 text-base text-body">{t(item.description)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
