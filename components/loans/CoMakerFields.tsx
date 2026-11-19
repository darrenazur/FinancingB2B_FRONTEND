'use client'

import { useState } from 'react'
import { latestCoMakers } from '../../app/loans/actions'
import type { CoMaker } from '../../lib/api/financing'
import DatePicker from '../forms/DatePicker'
import FileField from '../forms/FileField'
import { digitsOnly, Field, INPUT } from '../forms/FormDialog'
import { ROW_BUTTON_DANGER, ROW_BUTTON_NEUTRAL } from '../actions/rowButton'
import { t } from '../../lib/captions/t'

// The ID number hash includes the type, so one spelling per ID keeps duplicate checks working. Same list as the partner form.
const ID_TYPES = ['PASSPORT', 'DRIVERS', 'SSS', 'UMID', 'PHILSYS', 'TIN']
const GRID = 'grid gap-5 md:grid-cols-2'
const CHECKBOX = 'flex items-start gap-3 text-base text-body md:col-span-2'
const MINIMUM_AGE = 18

function latestBirthDate() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())
  return `${Number(today.slice(0, 4)) - MINIMUM_AGE}${today.slice(4)}`
}

// One co-maker as the form holds it. The saved ID number never comes back from the API: hasIdNumber says one is on file.
export interface CoMakerDraft {
  key: string
  firstName: string
  middleName: string
  lastName: string
  birthDate: string
  relationship: string
  contactNo: string
  email: string
  address: string
  idType: string
  idNo: string
  idImgPath: string
  hasIdNumber: boolean
  removeId: boolean
  // "Copy from last loan": the co-maker whose saved ID number and picture the API copies
  copyFrom: { loanId: number; coMakerId: number; loanNo: string; hasImage: boolean } | null
}

let nextKey = 0
const newKey = () => String(++nextKey)

export const blankCoMaker = (): CoMakerDraft => ({
  key: newKey(), firstName: '', middleName: '', lastName: '', birthDate: '', relationship: '', contactNo: '',
  email: '', address: '', idType: '', idNo: '', idImgPath: '', hasIdNumber: false, removeId: false, copyFrom: null,
})

// A saved co-maker, ready to edit
export const draftOf = (saved: CoMaker): CoMakerDraft => ({
  ...blankCoMaker(),
  firstName: saved.firstName, middleName: saved.middleName, lastName: saved.lastName, birthDate: saved.birthDate,
  relationship: saved.relationship, contactNo: saved.contactNo, email: saved.email, address: saved.address,
  idType: saved.idType, idImgPath: saved.idImgPath, hasIdNumber: saved.hasIdNumber,
})

// What the server action sends to the API. A copied ID goes as CopyIDFromCoMakerID, never as the number itself.
export const payloadOf = (draft: CoMakerDraft) => ({
  FirstName: draft.firstName, MiddleName: draft.middleName, LastName: draft.lastName, BirthDate: draft.birthDate,
  Relationship: draft.relationship, ContactNo: draft.contactNo, Email: draft.email, Address: draft.address,
  IDType: draft.removeId ? '' : draft.idType, IDNo: draft.removeId ? '' : draft.idNo,
  IDImgPath: draft.removeId ? '' : draft.idImgPath,
  RemoveID: draft.removeId,
  CopyIDFromCoMakerID: draft.copyFrom?.coMakerId ?? null,
})

interface CoMakerInputsProps {
  draft: CoMakerDraft
  onChange: (draft: CoMakerDraft) => void
  // Field code -> required, from Configuration > Partner Fields (the CB_ rows)
  required: Record<string, boolean>
  // Opens the saved ID picture of this co-maker
  viewHref?: string
  // Saved on a loan: an ID on file can be taken off when Partner Fields doesn't require it
  saved?: boolean
}

// The fields of one co-maker. Names are unique per co-maker, so several can sit in one form.
export function CoMakerInputs({ draft, onChange, required, viewHref, saved }: CoMakerInputsProps) {
  const set = (changes: Partial<CoMakerDraft>) => onChange({ ...draft, ...changes })
  const text = (name: keyof CoMakerDraft, clean: (value: string) => string = value => value) => ({
    name: `${draft.key}-${name}`,
    value: String(draft[name] ?? ''),
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => set({ [name]: clean(event.target.value) }),
  })
  const isRequired = (code: string) => required[code] ?? false
  const label = (caption: string, code: string) => (isRequired(code) ? t(caption) : t('UI_LABEL_OPTIONAL', { label: t(caption) }))
  const idTypes = draft.idType && !ID_TYPES.includes(draft.idType) ? [draft.idType, ...ID_TYPES] : ID_TYPES
  // A number is on file (saved, or copied with the same type), so a blank box keeps it
  const numberOnFile = draft.hasIdNumber || Boolean(draft.copyFrom)
  const imageOnFile = Boolean(draft.idImgPath) || Boolean(draft.copyFrom?.hasImage)
  const canRemoveId = saved && !isRequired('CB_ID') && (draft.hasIdNumber || Boolean(draft.idType) || Boolean(draft.idImgPath))

  return (
    <div className={GRID}>
      <Field label={t('UI_FIRST_NAME')}>
        <input {...text('firstName')} required maxLength={150} className={INPUT} />
      </Field>
      <Field label={t('UI_MIDDLE_NAME_OPTIONAL')}>
        <input {...text('middleName')} maxLength={150} className={INPUT} />
      </Field>
      <Field label={t('UI_LAST_NAME')}>
        <input {...text('lastName')} required maxLength={150} className={INPUT} />
      </Field>
      <Field label={label('UI_BIRTH_DATE', 'CB_BIRTHDATE')} hint={t('UI_MUST_BE_18_OR_OLDER')}>
        <DatePicker
          name={`${draft.key}-birthDate`}
          value={draft.birthDate}
          onChange={birthDate => set({ birthDate })}
          max={latestBirthDate()}
          required={isRequired('CB_BIRTHDATE')}
        />
      </Field>
      <Field label={label('UI_RELATIONSHIP', 'CB_RELATIONSHIP')} hint={t('UI_RELATIONSHIP_HINT')}>
        <input {...text('relationship')} required={isRequired('CB_RELATIONSHIP')} maxLength={50} className={INPUT} />
      </Field>
      <Field label={label('UI_MOBILE_NUMBER', 'CB_CONTACTNO')}>
        <input {...text('contactNo', digitsOnly)} inputMode="numeric" required={isRequired('CB_CONTACTNO')} maxLength={20} className={INPUT} />
      </Field>
      <Field label={label('UI_EMAIL', 'CB_EMAIL')}>
        <input {...text('email')} type="email" required={isRequired('CB_EMAIL')} maxLength={100} className={INPUT} />
      </Field>
      <Field label={label('UI_STREET_ADDRESS', 'CB_ADDRESS')}>
        <input {...text('address')} required={isRequired('CB_ADDRESS')} maxLength={200} className={INPUT} />
      </Field>
      {canRemoveId && (
        <label className={CHECKBOX}>
          <input type="checkbox" checked={draft.removeId} onChange={event => set({ removeId: event.target.checked })} className="mt-1 h-4 w-4" />
          {t('UI_REMOVE_THIS_ID')}
        </label>
      )}
      <fieldset disabled={draft.removeId} className="contents">
        <Field label={label('UI_ID_TYPE', 'CB_ID')}>
          <select {...text('idType')} required={isRequired('CB_ID')} className={INPUT}>
            <option value="">{t('UI_SELECT_ID_TYPE')}</option>
            {idTypes.map(type => <option key={type}>{type}</option>)}
          </select>
        </Field>
        <Field
          label={label('UI_ID_NUMBER', 'CB_ID')}
          hint={draft.copyFrom
            ? t('UI_COMAKER_ID_COPIED', { loanNo: draft.copyFrom.loanNo })
            : draft.hasIdNumber ? t('UI_SAVED_NUMBERS_STAY_HIDDEN_LEAVE_BLANK_TO_KEEP_THE_CURRENT') : undefined}
        >
          <input
            {...text('idNo')}
            type="password"
            autoComplete="off"
            required={isRequired('CB_ID') && !numberOnFile}
            maxLength={30}
            className={INPUT}
          />
        </Field>
        <FileField
          label={label('UI_ID_IMAGE', 'CB_ID')}
          name={`${draft.key}-idImgPath`}
          kind="cmid"
          value={draft.idImgPath}
          onChange={idImgPath => set({ idImgPath })}
          viewHref={draft.copyFrom ? `/files/loan-comaker/${draft.copyFrom.loanId}/${draft.copyFrom.coMakerId}` : viewHref}
          required={isRequired('CB_ID') && !imageOnFile}
        />
      </fieldset>
    </div>
  )
}

interface CoMakerListProps {
  // The chosen partner, for "Copy from last loan". Blank = none chosen yet
  partnerId: string
  required: Record<string, boolean>
}

// The co-makers of a new loan: none, one or more. Sent as one JSON field, "CoMakers".
export default function CoMakerList({ partnerId, required }: CoMakerListProps) {
  const [drafts, setDrafts] = useState<CoMakerDraft[]>([])
  const [copying, setCopying] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const update = (key: string, draft: CoMakerDraft) => setDrafts(current => current.map(item => (item.key === key ? draft : item)))
  const remove = (key: string) => setDrafts(current => current.filter(item => item.key !== key))

  const copy = async () => {
    setCopying(true)
    setNotice(null)
    const result = await latestCoMakers(Number(partnerId))
    setCopying(false)
    if (!result.ok) return setNotice(result.error)
    if (result.coMakers.length === 0) return setNotice(t('UI_NO_COMAKERS_ON_LAST_LOAN'))
    setDrafts(current => [
      ...current,
      ...result.coMakers.map(saved => ({
        ...draftOf(saved),
        // The picture and number stay on the old loan's record; the API copies them
        idImgPath: '',
        hasIdNumber: false,
        copyFrom: saved.hasIdNumber || saved.idImgPath
          ? { loanId: saved.loanId, coMakerId: saved.id, loanNo: saved.loanNo, hasImage: Boolean(saved.idImgPath) }
          : null,
      })),
    ])
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-muted">{t('UI_COMAKERS')}</p>
      <p className="text-base text-muted">{t('UI_COMAKERS_HINT')}</p>
      <input type="hidden" name="CoMakers" value={JSON.stringify(drafts.map(payloadOf))} />
      {drafts.map((draft, index) => (
        <div key={draft.key} className="flex flex-col gap-4 rounded-2xl border border-line p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-semibold text-ink">{t('UI_COMAKER_NUMBER', { number: index + 1 })}</p>
            <button type="button" onClick={() => remove(draft.key)} className={ROW_BUTTON_DANGER}>{t('UI_REMOVE')}</button>
          </div>
          <CoMakerInputs draft={draft} onChange={next => update(draft.key, next)} required={required} />
        </div>
      ))}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setDrafts(current => [...current, blankCoMaker()])} className={ROW_BUTTON_NEUTRAL}>
          {t('UI_ADD_COMAKER')}
        </button>
        {partnerId && (
          <button type="button" onClick={copy} disabled={copying} className={ROW_BUTTON_NEUTRAL}>
            {copying ? t('UI_LOADING') : t('UI_COPY_FROM_LAST_LOAN')}
          </button>
        )}
      </div>
      {notice && <p role="status" className="text-base text-muted">{notice}</p>}
    </div>
  )
}
