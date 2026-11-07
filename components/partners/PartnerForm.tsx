'use client'

import { useState } from 'react'
import { savePartner } from '../../app/partners/actions'
import type { PartnerDetails, PartnerLookups } from '../../lib/api/financing'
import DatePicker from '../forms/DatePicker'
import FileField from '../forms/FileField'
import FormDialog, { digitsOnly, Field, INPUT, useFields } from '../forms/FormDialog'
import { t } from '../../lib/captions/t'

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
  const fileHref = (kind: string, value: string) => (partner && value.startsWith('partners/') ? `/files/partner/${partner.id}/${kind}` : undefined)
  const idTypes = (current: string) => (current && !ID_TYPES.includes(current) ? [current, ...ID_TYPES] : ID_TYPES)

  return (
    <FormDialog
      title={isNew ? t('UI_ADD_PARTNER') : t('UI_EDIT_3', { firstName: saved.firstName, lastName: saved.lastName })}
      action={savePartner.bind(null, partner?.id ?? null)}
      onClose={onClose}
      lock={partner ? { type: 'PARTNER', id: partner.id } : undefined}
      wide
    >
      <input type="hidden" name="CountryCd" value={country?.code ?? ''} />

      <p className={SECTION}>{t('UI_CONTACT')}</p>
      <div className={GRID}>
        <Field label={t('UI_EMAIL')}>
          <input {...field('email')} name="Email" type="email" required maxLength={100} className={INPUT} />
        </Field>
        <Field label={t('UI_MOBILE_NUMBER')}>
          <input {...field('contactNo', digitsOnly)} name="ContactNo" inputMode="numeric" required maxLength={20} className={INPUT} />
        </Field>
        <Field label={t('UI_TELEPHONE')} hint={isNew ? undefined : t('UI_A_SAVED_NUMBER_CAN_BE_CHANGED_NOT_CLEARED')}>
          <input {...field('telephoneNo', digitsOnly)} name="TelephoneNo" inputMode="numeric" maxLength={20} className={INPUT} />
        </Field>
      </div>

      <p className={SECTION}>{t('UI_ADDRESS')}</p>
      <Field label={t('UI_STREET_ADDRESS')}>
        <input {...field('address')} name="Address" required maxLength={200} className={INPUT} />
      </Field>
      <div className={GRID}>
        <Field label={t('UI_COUNTRY')}>
          <select
            name="CountryID"
            required
            value={values.countryId}
            onChange={event => setValues(current => ({
              ...current, countryId: event.target.value, provinceId: '', cityId: '', zipCodeId: '',
            }))}
            className={INPUT}
          >
            <option value="">{t('UI_SELECT_COUNTRY')}</option>
            {lookups.countries.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </Field>
        <Field label={t('UI_PROVINCE')}>
          <select
            name="ProvinceID"
            required
            value={values.provinceId}
            onChange={event => setValues(current => ({
              ...current, provinceId: event.target.value, cityId: '', zipCodeId: '',
            }))}
            className={INPUT}
          >
            <option value="">{t('UI_SELECT_PROVINCE')}</option>
            {provinces.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </Field>
        <Field label={t('UI_CITY')}>
          <select
            name="CityID"
            required
            value={values.cityId}
            onChange={event => setValues(current => ({ ...current, cityId: event.target.value, zipCodeId: '' }))}
            className={INPUT}
          >
            <option value="">{t('UI_SELECT_CITY')}</option>
            {cities.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </Field>
        <Field label={t('UI_ZIP_CODE')}>
          <select {...field('zipCodeId')} name="ZIPCodeID" required className={INPUT}>
            <option value="">{t('UI_SELECT_ZIP_CODE')}</option>
            {zipCodes.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </Field>
      </div>

      <p className={SECTION}>{t('UI_IDENTITY')}</p>
      {!isNew && (
        <label className={CHECKBOX}>
          <input
            type="checkbox"
            name="UpdateSensitiveData"
            checked={unlocked}
            onChange={event => setUnlocked(event.target.checked)}
            className="mt-1 h-4 w-4"
          />
          {t('UI_CHANGE_NAME_BIRTH_DATE_OR_ID_DETAILS_ANY_CHANGE_HERE_PUTS')}
        </label>
      )}
      <fieldset disabled={!unlocked} className="flex flex-col gap-5">
        <div className={GRID}>
          <Field label={t('UI_FIRST_NAME')}>
            <input {...field('firstName')} name="FirstName" required maxLength={150} className={INPUT} />
          </Field>
          <Field label={t('UI_MIDDLE_NAME_OPTIONAL')}>
            <input {...field('middleName')} name="MiddleName" maxLength={150} className={INPUT} />
          </Field>
          <Field label={t('UI_LAST_NAME')}>
            <input {...field('lastName')} name="LastName" required maxLength={150} className={INPUT} />
          </Field>
          <Field label={t('UI_BIRTH_DATE')} hint={t('UI_MUST_BE_18_OR_OLDER')}>
            <DatePicker
              name="BirthDate"
              value={values.birthDate}
              onChange={birthDate => setValues(current => ({ ...current, birthDate }))}
              max={latestBirthDate()}
              required
            />
          </Field>
          <Field label={t('UI_ID_TYPE')}>
            <select {...field('idType1')} name="IDType1" required={isNew} className={INPUT}>
              <option value="">{t('UI_SELECT_ID_TYPE')}</option>
              {idTypes(values.idType1).map(type => <option key={type}>{type}</option>)}
            </select>
          </Field>
          <Field label={t('UI_ID_NUMBER')} hint={isNew ? undefined : t('UI_SAVED_NUMBERS_STAY_HIDDEN_LEAVE_BLANK_TO_KEEP_THE_CURRENT')}>
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
          <FileField
            label={t('UI_ID_IMAGE')}
            name="IDImgPath1"
            kind="id"
            value={values.idImgPath1}
            onChange={key => setValues(current => ({ ...current, idImgPath1: key }))}
            viewHref={fileHref('id1', values.idImgPath1)}
            required={isNew}
          />
          <FileField
            label={t('UI_SELFIE_OPTIONAL')}
            name="SelfiePath"
            kind="selfie"
            value={values.selfiePath}
            onChange={key => setValues(current => ({ ...current, selfiePath: key }))}
            viewHref={fileHref('selfie', values.selfiePath)}
          />
          <Field label={t('UI_SECOND_ID_TYPE_OPTIONAL')}>
            <select {...field('idType2')} name="IDType2" className={INPUT}>
              <option value="">{t('UI_NONE')}</option>
              {idTypes(values.idType2).map(type => <option key={type}>{type}</option>)}
            </select>
          </Field>
          <Field label={t('UI_SECOND_ID_NUMBER')}>
            <input
              {...field('idNo2')}
              name="IDNo2"
              type="password"
              autoComplete="off"
              maxLength={30}
              className={INPUT}
            />
          </Field>
          <FileField
            label={t('UI_SECOND_ID_IMAGE')}
            name="IDImgPath2"
            kind="id"
            value={values.idImgPath2}
            onChange={key => setValues(current => ({ ...current, idImgPath2: key }))}
            viewHref={fileHref('id2', values.idImgPath2)}
          />
        </div>
      </fieldset>

      {isNew && (
        <>
          <p className={SECTION}>{t('UI_CONSENT')}</p>
          <label className={CHECKBOX}>
            <input
              type="checkbox"
              name="IsAccepted"
              required
              checked={accepted}
              onChange={event => setAccepted(event.target.checked)}
              className="mt-1 h-4 w-4"
            />
            {t('UI_THE_BORROWER_ACCEPTED_THE_TERMS_AND_CONDITIONS')}
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
            {t('UI_THE_BORROWER_AGREED_TO_THE_USE_OF_THEIR_PERSONAL_DATA')}
          </label>
        </>
      )}
    </FormDialog>
  )
}
