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
  group: 'UI_REFERENCE_DATA' | 'UI_MASTER_DATA' | 'UI_CONFIGURATION_TABLES'
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
  label: 'UI_COUNTRY',
  type: 'select',
  source: { resource: 'country', labelField: 'CountryName' },
}
const PROVINCE: ConfigField = {
  name: 'ProvinceID',
  label: 'UI_PROVINCE',
  type: 'select',
  source: { resource: 'province', labelField: 'ProvinceName' },
  parent: 'CountryID',
}
const CITY: ConfigField = {
  name: 'CityID',
  label: 'UI_CITY',
  type: 'select',
  source: { resource: 'city', labelField: 'CityName' },
  parent: 'ProvinceID',
}

export const CONFIG_RESOURCES: ConfigResource[] = [
  {
    key: 'caption',
    label: 'UI_CAPTIONS',
    description: 'UI_WORDING_OF_THE_MESSAGES_PEOPLE_SEE',
    group: 'UI_REFERENCE_DATA',
    path: 'caption',
    idField: 'CaptionID',
    fields: [
      { name: 'CaptionCd', label: 'UI_CODE', type: 'text', lockOnEdit: true, maxLength: 150 },
      { name: 'CaptionText', label: 'UI_CAPTION', type: 'text', maxLength: 500 },
    ],
    note: 'UI_A_CODE_MUST_MATCH_WHAT_THE_PROGRAM_SENDS_EXACTLY_A_SAVED',
  },
  {
    key: 'tenure',
    label: 'UI_TENURE',
    description: 'UI_LOAN_LENGTHS_IN_MONTHS',
    group: 'UI_REFERENCE_DATA',
    path: 'tenure-duration',
    idField: 'TenureDurationID',
    fields: [{ name: 'Duration', label: 'UI_MONTHS_3', type: 'number', min: 1 }],
    note: 'UI_A_CHANGE_HERE_APPLIES_TO_NEW_LOANS_CHECK_EXISTING_LOANS',
  },
  {
    key: 'currency',
    label: 'UI_CURRENCY',
    description: 'UI_CURRENCIES_A_LOAN_CAN_USE',
    group: 'UI_REFERENCE_DATA',
    path: 'currency',
    idField: 'CurrencyID',
    fields: [
      { name: 'CurrencyCd', label: 'UI_CODE', type: 'text', exactLength: 3, uppercase: true, lockOnEdit: true },
      { name: 'CurrencyName', label: 'UI_NAME', type: 'text', maxLength: 50 },
    ],
    note: 'UI_A_CURRENCY_CODE_CANT_BE_CHANGED_AFTER_IT_IS_ADDED_BECAUSE',
  },
  {
    key: 'settlement-structure',
    label: 'UI_SETTLEMENT_STRUCTURE_2',
    description: 'UI_HOW_LOAN_INTEREST_IS_COMPUTED',
    group: 'UI_REFERENCE_DATA',
    path: 'settlement-structure',
    idField: 'SettlementStructID',
    fields: [{ name: 'Name', label: 'UI_NAME', type: 'text', maxLength: 255 }],
    readOnly: true,
    note: 'UI_VIEW_ONLY_LOAN_COMPUTATION_DEPENDS_ON_THE_EXACT_NAMES',
  },
  {
    key: 'term-type',
    label: 'UI_TERM_TYPE',
    description: 'UI_HOW_OFTEN_A_BORROWER_PAYS',
    group: 'UI_REFERENCE_DATA',
    path: 'term-type',
    idField: 'TermTypeID',
    fields: [
      { name: 'TermName', label: 'UI_NAME', type: 'text', maxLength: 255 },
      { name: 'Code', label: 'UI_CODE', type: 'text', maxLength: 20, uppercase: true },
      { name: 'IntervalDays', label: 'UI_EVERY_DAYS', type: 'number', min: 0 },
      { name: 'IntervalMonths', label: 'UI_EVERY_MONTHS', type: 'number', min: 0 },
    ],
    oneIntervalOnly: true,
    note: 'UI_INTERVALS_SET_THE_PAYMENT_DATES_AND_PERIOD_RATE_OF_NEW',
  },
  {
    key: 'number-range',
    label: 'UI_NUMBER_RANGES',
    description: 'UI_NUMBERS_GIVEN_TO_PARTNERS_LOANS_AND_PAYMENTS',
    group: 'UI_REFERENCE_DATA',
    path: 'number-range',
    idField: 'NoRangeCd',
    fields: [
      { name: 'NoRangeCd', label: 'UI_CODE', type: 'text' },
      { name: 'ShortText', label: 'UI_DESCRIPTION', type: 'text' },
      { name: 'NoRangeFrom', label: 'UI_FROM', type: 'text' },
      { name: 'NoRangeTo', label: 'UI_TO', type: 'text' },
      { name: 'CurrentNo', label: 'UI_CURRENT_NO', type: 'text' },
    ],
    readOnly: true,
    note: 'UI_VIEW_ONLY_THE_SYSTEM_MOVES_THE_CURRENT_NUMBER_EACH_TIME_A',
  },
  {
    key: 'country',
    label: 'UI_COUNTRY',
    description: 'UI_COUNTRIES_AND_DIALING_CODES',
    group: 'UI_MASTER_DATA',
    path: 'country',
    idField: 'CountryID',
    fields: [
      { name: 'CountryCd', label: 'UI_CODE', type: 'text', maxLength: 10 },
      { name: 'CountryName', label: 'UI_NAME', type: 'text', maxLength: 100 },
    ],
  },
  {
    key: 'province',
    label: 'UI_PROVINCE',
    description: 'UI_PROVINCES_IN_EACH_COUNTRY',
    group: 'UI_MASTER_DATA',
    path: 'province',
    idField: 'ProvinceID',
    fields: [COUNTRY, { name: 'ProvinceName', label: 'UI_NAME', type: 'text', maxLength: 100 }],
  },
  {
    key: 'city',
    label: 'UI_CITY',
    description: 'UI_CITIES_IN_EACH_PROVINCE',
    group: 'UI_MASTER_DATA',
    path: 'city',
    idField: 'CityID',
    fields: [COUNTRY, PROVINCE, { name: 'CityName', label: 'UI_NAME', type: 'text', maxLength: 100 }],
  },
  {
    key: 'zip-code',
    label: 'UI_ZIP_CODE_2',
    description: 'UI_ZIP_CODES_IN_EACH_CITY',
    group: 'UI_MASTER_DATA',
    path: 'zipcode',
    idField: 'ZIPCodeID',
    fields: [COUNTRY, PROVINCE, CITY, { name: 'ZipCode', label: 'UI_ZIP_CODE', type: 'text', maxLength: 20 }],
  },
]

// Configuration tables: lists the owner keeps for the partner and loan forms. Delete only hides an item from new choices.
CONFIG_RESOURCES.push(
  {
    key: 'loan-purpose',
    label: 'UI_LOAN_PURPOSES',
    description: 'UI_LOAN_PURPOSES_DESCRIPTION',
    group: 'UI_CONFIGURATION_TABLES',
    path: 'loan-purpose',
    idField: 'LoanPurposeID',
    fields: [{ name: 'Name', label: 'UI_NAME', type: 'text', maxLength: 100 }],
  },
  {
    key: 'income-source',
    label: 'UI_INCOME_SOURCES',
    description: 'UI_INCOME_SOURCES_DESCRIPTION',
    group: 'UI_CONFIGURATION_TABLES',
    path: 'income-source',
    idField: 'IncomeSourceID',
    fields: [{ name: 'Name', label: 'UI_NAME', type: 'text', maxLength: 100 }],
  },
  {
    key: 'income-source-type',
    label: 'UI_INCOME_SOURCE_TYPES',
    description: 'UI_INCOME_SOURCE_TYPES_DESCRIPTION',
    group: 'UI_CONFIGURATION_TABLES',
    path: 'income-source-type',
    idField: 'IncomeSourceTypeID',
    fields: [
      { name: 'IncomeSourceID', label: 'UI_SOURCE_OF_INCOME', type: 'select', source: { resource: 'income-source', labelField: 'Name' } },
      { name: 'Name', label: 'UI_NAME', type: 'text', maxLength: 100 },
    ],
  },
)

export function findResource(key: string): ConfigResource | undefined {
  return CONFIG_RESOURCES.find(resource => resource.key === key)
}
