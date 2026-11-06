import Link from 'next/link'
import { notFound } from 'next/navigation'
import ConfigTable, { ConfigRow, FieldOption } from '../../../components/config/ConfigTable'
import PageHeader from '../../../components/PageHeader'
import { getList } from '../../../lib/api/client'
import { CONFIG_RESOURCES, ConfigResource, findResource } from '../../../lib/config/resources'

type ApiRow = Record<string, string | number | boolean | null>

const getRows = (resource: ConfigResource) => getList<ApiRow>(`/${resource.path}-view`)

function toOptions(sourceRows: ApiRow[], source: ConfigResource, labelField: string): FieldOption[] {
  return sourceRows.map(row => ({
    value: Number(row[source.idField]),
    label: String(row[labelField]),
    deleted: Boolean(row.Deleted),
    parents: {
      CountryID: Number(row.CountryID),
      ProvinceID: Number(row.ProvinceID),
    },
  }))
}

export default async function ConfigResourcePage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource: key } = await params
  const resource = findResource(key)
  if (!resource) notFound()

  const selectFields = resource.fields.filter(field => field.source)
  const [rows, ...sources] = await Promise.all([
    getRows(resource),
    ...selectFields.map(field => {
      const source = CONFIG_RESOURCES.find(item => item.key === field.source?.resource)
      if (!source) throw new Error(`Unknown source for ${field.name}`)
      return getRows(source)
    }),
  ])

  const options: Record<string, FieldOption[]> = {}
  selectFields.forEach((field, index) => {
    const source = CONFIG_RESOURCES.find(item => item.key === field.source?.resource)
    if (source && field.source) options[field.name] = toOptions(sources[index], source, field.source.labelField)
  })

  // Only the configured fields reach the browser.
  const tableRows: ConfigRow[] = rows.map(row => ({
    id: Number(row[resource.idField]),
    deleted: Boolean(row.Deleted),
    values: Object.fromEntries(resource.fields.map(field => [field.name, String(row[field.name] ?? '')])),
  }))

  return (
    <>
      <Link href="/config" className="mb-4 inline-block text-base font-medium text-accent-strong hover:underline">
        ← Configuration
      </Link>
      <PageHeader title={resource.label} description={`${resource.group}. ${resource.description}.`} />
      <ConfigTable resource={resource} rows={tableRows} options={options} />
    </>
  )
}
