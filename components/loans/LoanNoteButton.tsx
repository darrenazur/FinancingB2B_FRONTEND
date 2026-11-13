'use client'

import { useState } from 'react'
import { saveLoanNote } from '../../app/loans/actions'
import type { ListOption, Loan } from '../../lib/api/financing'
import FormDialog from '../forms/FormDialog'
import PromissoryNoteFields from './PromissoryNoteFields'
import { t } from '../../lib/captions/t'

// Remarks and the promissory note only. Works after payments, since money and terms stay as they are.
export default function LoanNoteButton({ loan, purposes, className }: { loan: Loan; purposes: ListOption[]; className: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>{t('UI_EDIT_REMARKS_AND_NOTE')}</button>
      {open && (
        <FormDialog
          title={t('UI_REMARKS_AND_NOTE_OF_LOAN', { loanNo: loan.loanNo })}
          action={saveLoanNote.bind(null, loan.id)}
          onClose={() => setOpen(false)}
          lock={{ type: 'LOAN', id: loan.id }}
        >
          <p className="text-base text-muted">{t('UI_REMARKS_AND_NOTE_HINT')}</p>
          <PromissoryNoteFields loan={loan} purposes={purposes} />
        </FormDialog>
      )}
    </>
  )
}
