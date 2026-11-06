import Link from 'next/link'
import PageHeader from '../../components/PageHeader'
import { CONFIG_RESOURCES, ConfigResource } from '../../lib/config/resources'

const GROUPS: ConfigResource['group'][] = ['Reference Data', 'Master Data']

export default function ConfigPage() {
  return (
    <>
      <PageHeader title="Configuration" description="Lists used across loans and partner records." />

      {GROUPS.map(group => (
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
