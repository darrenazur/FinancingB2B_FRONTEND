'use client'

import { useState } from 'react'
import type { Loan } from '../../lib/api/financing'
import FileField from '../forms/FileField'
import { Field, INPUT } from '../forms/FormDialog'
import { t } from '../../lib/captions/t'

// Remarks and the promissory note, shared by the loan form and the remarks-only form.
// The picture is optional: the checkbox alone records that the borrower signed a note.
export default function PromissoryNoteFields({ loan }: { loan: Loan | null }) {
  const [remarks, setRemarks] = useState(loan?.remarks ?? '')
  const [hasNote, setHasNote] = useState(loan?.hasPromissoryNote ?? false)
  const [noteFile, setNoteFile] = useState(loan?.promissoryNoteFile ?? '')

  return (
    <>
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
