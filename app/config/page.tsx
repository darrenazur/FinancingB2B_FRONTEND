import Link from 'next/link'
import { redirect } from 'next/navigation'
import PageHeader from '../../components/PageHeader'
import { getCurrentUser } from '../../lib/api/session'
import { CONFIG_RESOURCES, ConfigResource } from '../../lib/config/resources'
import { can } from '../../lib/permissions'

const GROUPS: ConfigResource['group'][] = ['Reference Data', 'Master Data']
const SECURITY = [
  { href: '/config/users', label: 'Users', description: 'People who can sign in', permission: 'user.manage' },
  { href: '/config/roles', label: 'Roles', description: 'What each role can do', permission: 'role.manage' },
  { href: '/config/locks', label: 'Locks', description: 'Records being edited now', permission: 'lock.release' },
]

export default async function ConfigPage() {
  const permissions = (await getCurrentUser())?.permissions ?? []
  const security = SECURITY.filter(item => can(permissions, item.permission))
  const showLists = can(permissions, 'config.view')
  if (!showLists && security.length === 0) redirect('/dashboard')

  return (
    <>
      <PageHeader title="Configuration" description="Lists used across loans and partner records." />

      {security.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold tracking-tight text-ink">Security</h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {security.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-line bg-surface p-7 transition-colors hover:border-accent"
              >
                <p className="text-lg font-semibold text-ink">{item.label}</p>
                <p className="mt-2 text-base text-body">{item.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {showLists && GROUPS.map(group => (
        <section key={group} className="mb-10">
          <h2 className="mb-4 text-xl font-semibold tracking-tight text-ink">{group}</h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {CONFIG_RESOURCES.filter(resource => resource.group === group).map(resource => (
              <Link
                key={resource.key}
                href={`/config/${resource.key}`}
                className="rounded-2xl border border-line bg-surface p-7 transition-colors hover:border-accent"
              >
                <p className="text-lg font-semibold text-ink">{resource.label}</p>
                <p className="mt-1 text-base text-body">{resource.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
