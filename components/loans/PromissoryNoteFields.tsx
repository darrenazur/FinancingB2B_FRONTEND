'use client'

import { useState } from 'react'
import type { ListOption, Loan } from '../../lib/api/financing'
import FileField from '../forms/FileField'
import { Field, INPUT } from '../forms/FormDialog'
import { t } from '../../lib/captions/t'

interface PromissoryNoteFieldsProps {
  loan: Loan | null
  purposes: ListOption[]
}

// Purpose, remarks and the promissory note, shared by the loan form and the remarks-only form.
// None of them is money or terms, so the remarks-only form can change them after payments.
// The picture is optional: the checkbox alone records that the borrower signed a note.
export default function PromissoryNoteFields({ loan, purposes }: PromissoryNoteFieldsProps) {
  const [purposeId, setPurposeId] = useState(loan?.loanPurposeId ? String(loan.loanPurposeId) : '')
  const [remarks, setRemarks] = useState(loan?.remarks ?? '')
  const [hasNote, setHasNote] = useState(loan?.hasPromissoryNote ?? false)
  const [noteFile, setNoteFile] = useState(loan?.promissoryNoteFile ?? '')

  // A purpose deleted from the list stays on the loan that already has it, but isn't offered to others
  const choices = purposes.filter(purpose => !purpose.deleted || purpose.id === loan?.loanPurposeId)

  return (
    <>
      <Field label={t('UI_PURPOSE_OF_LOAN')}>
        <select
          name="LoanPurposeID"
          value={purposeId}
          onChange={event => setPurposeId(event.target.value)}
          // A new loan needs one. An older loan without one can be saved as it is until it's filled in.
          required={!loan || loan.loanPurposeId !== null}
          className={INPUT}
        >
          <option value="">{t('UI_SELECT_PURPOSE')}</option>
          {choices.map(purpose => <option key={purpose.id} value={purpose.id}>{purpose.label}</option>)}
        </select>
      </Field>
      <Field label={t('UI_REMARKS')}>
        <textarea name="Remarks" value={remarks} onChange={event => setRemarks(event.target.value)} rows={3} maxLength={500} className={INPUT} />
      </Field>
      <label className="flex items-center gap-3 text-base text-body">
        <input
          type="checkbox"
          name="HasPromissoryNote"
          value="1"
          checked={hasNote}
          onChange={event => setHasNote(event.target.checked)}
          className="h-4 w-4"
        />
        {t('UI_HAS_PROMISSORY_NOTE')}
      </label>
      {hasNote && (
        <FileField
          label={t('UI_PROMISSORY_NOTE_PICTURE')}
          name="PromissoryNotePath"
          kind="note"
          value={noteFile}
          onChange={setNoteFile}
          viewHref={loan && loan.promissoryNoteFile ? `/files/loan-note/${loan.id}` : undefined}
        />
      )}
    </>
  )
}
