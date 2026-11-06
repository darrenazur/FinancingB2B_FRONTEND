// What each Configuration screen shows and sends. Field names match the API body.
export interface ConfigField {
  name: string
  label: string
  type: 'text' | 'number' | 'select'
  maxLength?: number
  exactLength?: number
  uppercase?: boolean
  min?: number
  lockOnEdit?: boolean
  source?: { resource: string; labelField: string }
  parent?: string
}

export interface ConfigResource {
  key: string
  label: string
  description: string
  group: 'Reference Data' | 'Master Data'
  path: string
  idField: string
  fields: ConfigField[]
  readOnly?: boolean
  note?: string
  oneIntervalOnly?: boolean
}

export interface SaveState {
  ok: boolean
  error: string | null
  // Shown after a successful save, when the result itself is worth reading.
  notice?: string
}

const COUNTRY: ConfigField = {
  name: 'CountryID',
  label: 'Country',
  type: 'select',
  source: { resource: 'country', labelField: 'CountryName' },
}
const PROVINCE: ConfigField = {
  name: 'ProvinceID',
  label: 'Province',
  type: 'select',
  source: { resource: 'province', labelField: 'ProvinceName' },
  parent: 'CountryID',
}
const CITY: ConfigField = {
  name: 'CityID',
  label: 'City',
  type: 'select',
  source: { resource: 'city', labelField: 'CityName' },
  parent: 'ProvinceID',
}

export const CONFIG_RESOURCES: ConfigResource[] = [
  {
    key: 'tenure',
    label: 'Tenure',
    description: 'Loan lengths in months',
    group: 'Reference Data',
    path: 'tenure-duration',
    idField: 'TenureDurationID',
    fields: [{ name: 'Duration', label: 'Months', type: 'number', min: 1 }],
    note: 'A change here applies to new loans. Check existing loans before editing a value in use.',
  },
  {
    key: 'currency',
    label: 'Currency',
    description: 'Currencies a loan can use',
    group: 'Reference Data',
    path: 'currency',
    idField: 'CurrencyID',
    fields: [
      { name: 'CurrencyCd', label: 'Code', type: 'text', exactLength: 3, uppercase: true, lockOnEdit: true },
      { name: 'CurrencyName', label: 'Name', type: 'text', maxLength: 50 },
    ],
    note: 'A currency code can’t be changed after it is added, because loans refer to it.',
  },
  {
    key: 'settlement-structure',
    label: 'Settlement Structure',
    description: 'How loan interest is computed',
    group: 'Reference Data',
    path: 'settlement-structure',
    idField: 'SettlementStructID',
    fields: [{ name: 'Name', label: 'Name', type: 'text', maxLength: 255 }],
    readOnly: true,
    note: 'View only. Loan computation depends on the exact names FIXED and DIMINISHING.',
  },
  {
    key: 'term-type',
    label: 'Term Type',
    description: 'How often a borrower pays',
    group: 'Reference Data',
    path: 'term-type',
    idField: 'TermTypeID',
    fields: [
      { name: 'TermName', label: 'Name', type: 'text', maxLength: 255 },
      { name: 'Code', label: 'Code', type: 'text', maxLength: 20, uppercase: true },
      { name: 'IntervalDays', label: 'Every (days)', type: 'number', min: 0 },
      { name: 'IntervalMonths', label: 'Every (months)', type: 'number', min: 0 },
    ],
    oneIntervalOnly: true,
    note: 'Intervals set the payment dates and period rate of new loans. Fill in days or months, not both.',
  },
  {
    key: 'number-range',
    label: 'Number Ranges',
    description: 'Numbers given to partners, loans and payments',
    group: 'Reference Data',
    path: 'number-range',
    idField: 'NoRangeCd',
    fields: [
      { name: 'NoRangeCd', label: 'Code', type: 'text' },
      { name: 'ShortText', label: 'Description', type: 'text' },
      { name: 'NoRangeFrom', label: 'From', type: 'text' },
      { name: 'NoRangeTo', label: 'To', type: 'text' },
      { name: 'CurrentNo', label: 'Current no.', type: 'text' },
    ],
    readOnly: true,
    note: 'View only. The system moves the current number each time a record is saved.',
  },
  {
    key: 'country',
    label: 'Country',
    description: 'Countries and dialing codes',
    group: 'Master Data',
    path: 'country',
    idField: 'CountryID',
    fields: [
      { name: 'CountryCd', label: 'Code', type: 'text', maxLength: 10 },
      { name: 'CountryName', label: 'Name', type: 'text', maxLength: 100 },
    ],
  },
  {
    key: 'province',
    label: 'Province',
    description: 'Provinces in each country',
    group: 'Master Data',
    path: 'province',
    idField: 'ProvinceID',
    fields: [COUNTRY, { name: 'ProvinceName', label: 'Name', type: 'text', maxLength: 100 }],
  },
  {
    key: 'city',
    label: 'City',
    description: 'Cities in each province',
    group: 'Master Data',
    path: 'city',
    idField: 'CityID',
    fields: [COUNTRY, PROVINCE, { name: 'CityName', label: 'Name', type: 'text', maxLength: 100 }],
  },
  {
    key: 'zip-code',
    label: 'Zip Code',
    description: 'Zip codes in each city',
    group: 'Master Data',
    path: 'zipcode',
    idField: 'ZIPCodeID',
    fields: [COUNTRY, PROVINCE, CITY, { name: 'ZipCode', label: 'Zip code', type: 'text', maxLength: 20 }],
  },
]

export function findResource(key: string): ConfigResource | undefined {
  return CONFIG_RESOURCES.find(resource => resource.key === key)
}
