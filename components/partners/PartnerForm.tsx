'use client'

import { useState } from 'react'
import { savePartner } from '../../app/partners/actions'
import type { PartnerDetails, PartnerLookups } from '../../lib/api/financing'
import DatePicker from '../forms/DatePicker'
import FormDialog, { digitsOnly, Field, INPUT, useFields } from '../forms/FormDialog'

// The ID number hash includes the type, so one spelling per ID keeps duplicate checks working.
const ID_TYPES = ['PASSPORT', 'DRIVERS', 'SSS', 'UMID', 'PHILSYS', 'TIN']
const CHECKBOX = 'flex items-start gap-3 text-base text-body'
const SECTION = 'text-sm font-semibold uppercase tracking-wide text-muted'
const GRID = 'grid gap-5 md:grid-cols-2'
const MINIMUM_AGE = 18

function latestBirthDate() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())
  return `${Number(today.slice(0, 4)) - MINIMUM_AGE}${today.slice(4)}`
}

const BLANK: Omit<PartnerDetails, 'id'> = {
  firstName: '', middleName: '', lastName: '', birthDate: '', address: '',
  countryId: '', provinceId: '', cityId: '', zipCodeId: '',
  contactNo: '', email: '', telephoneNo: '',
  idType1: '', idImgPath1: '', idType2: '', idImgPath2: '', selfiePath: '',
}

interface PartnerFormProps {
  partner: PartnerDetails | null
  lookups: PartnerLookups
  onClose: () => void
}

export default function PartnerForm({ partner, lookups, onClose }: PartnerFormProps) {
  const isNew = partner === null
  const saved: Omit<PartnerDetails, 'id'> = partner ?? BLANK
  const { values, setValues, field } = useFields({ ...saved, idNo1: '', idNo2: '' })
  const [unlocked, setUnlocked] = useState(isNew)
  const [accepted, setAccepted] = useState(false)
  const [consented, setConsented] = useState(false)

  const country = lookups.countries.find(item => String(item.id) === values.countryId)
  const provinces = lookups.provinces.filter(item => String(item.countryId) === values.countryId)
  const cities = lookups.cities.filter(item => String(item.provinceId) === values.provinceId)
  const zipCodes = lookups.zipCodes.filter(item => String(item.cityId) === values.cityId)
  const idTypes = (current: string) => (current && !ID_TYPES.includes(current) ? [current, ...ID_TYPES] : ID_TYPES)

  return (
    <FormDialog
      title={isNew ? 'Add partner' : `Edit ${saved.firstName} ${saved.lastName}`}
      action={savePartner.bind(null, partner?.id ?? null)}
      onClose={onClose}
      lock={partner ? { type: 'PARTNER', id: partner.id } : undefined}
      wide
    >
      <input type="hidden" name="CountryCd" value={country?.code ?? ''} />

      <p className={SECTION}>Contact</p>
      <div className={GRID}>
        <Field label="Email">
          <input {...field('email')} name="Email" type="email" required maxLength={100} className={INPUT} />
        </Field>
        <Field label="Mobile number">
          <input {...field('contactNo', digitsOnly)} name="ContactNo" inputMode="numeric" required maxLength={20} className={INPUT} />
        </Field>
        <Field label="Telephone" hint={isNew ? undefined : 'A saved number can be changed, not cleared.'}>
          <input {...field('telephoneNo', digitsOnly)} name="TelephoneNo" inputMode="numeric" maxLength={20} className={INPUT} />
        </Field>
      </div>

      <p className={SECTION}>Address</p>
      <Field label="Street address">
        <input {...field('address')} name="Address" required maxLength={200} className={INPUT} />
      </Field>
      <div className={GRID}>
        <Field label="Country">
          <select
            name="CountryID"
            required
            value={values.countryId}
            onChange={event => setValues(current => ({
              ...current, countryId: event.target.value, provinceId: '', cityId: '', zipCodeId: '',
            }))}
            className={INPUT}
          >
            <option value="">Select country</option>
            {lookups.countries.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </Field>
        <Field label="Province">
          <select
            name="ProvinceID"
            required
            value={values.provinceId}
            onChange={event => setValues(current => ({
              ...current, provinceId: event.target.value, cityId: '', zipCodeId: '',
            }))}
            className={INPUT}
          >
            <option value="">Select province</option>
            {provinces.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </Field>
        <Field label="City">
          <select
            name="CityID"
            required
            value={values.cityId}
            onChange={event => setValues(current => ({ ...current, cityId: event.target.value, zipCodeId: '' }))}
            className={INPUT}
          >
            <option value="">Select city</option>
            {cities.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </Field>
        <Field label="Zip code">
          <select {...field('zipCodeId')} name="ZIPCodeID" required className={INPUT}>
            <option value="">Select zip code</option>
            {zipCodes.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </Field>
      </div>

      <p className={SECTION}>Identity</p>
      {!isNew && (
        <label className={CHECKBOX}>
          <input
            type="checkbox"
            name="UpdateSensitiveData"
            checked={unlocked}
            onChange={event => setUnlocked(event.target.checked)}
            className="mt-1 h-4 w-4"
          />
          Change name, birth date or ID details. Any change here puts verification back to Pending.
        </label>
      )}
      <fieldset disabled={!unlocked} className="flex flex-col gap-5">
        <div className={GRID}>
          <Field label="First name">
            <input {...field('firstName')} name="FirstName" required maxLength={150} className={INPUT} />
          </Field>
          <Field label="Middle name (optional)">
            <input {...field('middleName')} name="MiddleName" maxLength={150} className={INPUT} />
          </Field>
          <Field label="Last name">
            <input {...field('lastName')} name="LastName" required maxLength={150} className={INPUT} />
          </Field>
          <Field label="Birth date" hint="Must be 18 or older.">
            <DatePicker
              name="BirthDate"
              value={values.birthDate}
              onChange={birthDate => setValues(current => ({ ...current, birthDate }))}
              max={latestBirthDate()}
              required
            />
          </Field>
          <Field label="ID type">
            <select {...field('idType1')} name="IDType1" required={isNew} className={INPUT}>
              <option value="">Select ID type</option>
              {idTypes(values.idType1).map(type => <option key={type}>{type}</option>)}
            </select>
          </Field>
          <Field label="ID number" hint={isNew ? undefined : 'Saved numbers stay hidden. Leave blank to keep the current one.'}>
            <input
              {...field('idNo1')}
              name="IDNo1"
              type="password"
              autoComplete="off"
              required={isNew}
              maxLength={30}
              className={INPUT}
            />
          </Field>
          <Field label="ID image path">
            <input {...field('idImgPath1')} name="IDImgPath1" required={isNew} maxLength={500} className={INPUT} />
          </Field>
          <Field label="Selfie path (optional)">
            <input {...field('selfiePath')} name="SelfiePath" maxLength={500} className={INPUT} />
          </Field>
          <Field label="Second ID type (optional)">
            <select {...field('idType2')} name="IDType2" className={INPUT}>
              <option value="">None</option>
              {idTypes(values.idType2).map(type => <option key={type}>{type}</option>)}
            </select>
          </Field>
          <Field label="Second ID number">
            <input
              {...field('idNo2')}
              name="IDNo2"
              type="password"
              autoComplete="off"
              maxLength={30}
              className={INPUT}
            />
          </Field>
          <Field label="Second ID image path">
            <input {...field('idImgPath2')} name="IDImgPath2" maxLength={500} className={INPUT} />
          </Field>
        </div>
      </fieldset>

      {isNew && (
        <>
          <p className={SECTION}>Consent</p>
          <label className={CHECKBOX}>
            <input
              type="checkbox"
              name="IsAccepted"
              required
              checked={accepted}
              onChange={event => setAccepted(event.target.checked)}
              className="mt-1 h-4 w-4"
            />
            The borrower accepted the terms and conditions.
          </label>
          <label className={CHECKBOX}>
            <input
              type="checkbox"
              name="DataUsageConsent"
              required
              checked={consented}
              onChange={event => setConsented(event.target.checked)}
              className="mt-1 h-4 w-4"
            />
            The borrower agreed to the use of their personal data.
          </label>
        </>
      )}
    </FormDialog>
  )
}
