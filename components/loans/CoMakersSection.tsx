'use client'

import { useState } from 'react'
import { removeCoMaker, saveCoMaker } from '../../app/loans/actions'
import type { CoMaker } from '../../lib/api/financing'
import { formatDate } from '../../lib/format'
import ConfirmAction from '../actions/ConfirmAction'
import { ROW_BUTTON_NEUTRAL } from '../actions/rowButton'
import FormDialog from '../forms/FormDialog'
import { blankCoMaker, CoMakerDraft, CoMakerInputs, draftOf, payloadOf } from './CoMakerFields'
import { t } from '../../lib/captions/t'

interface CoMakersSectionProps {
  loanId: number
  loanNo: string
  coMakers: CoMaker[]
  required: Record<string, boolean>
  // Open loan and loan.note: add, change and remove. Otherwise read only
  canEdit: boolean
}

// The co-makers who signed this loan's promissory note. Each one is liable for the whole loan.
export default function CoMakersSection({ loanId, loanNo, coMakers, required, canEdit }: CoMakersSectionProps) {
  const [editing, setEditing] = useState<CoMaker | 'new' | null>(null)
  const fullName = (item: CoMaker) => [item.firstName, item.middleName, item.lastName].filter(Boolean).join(' ')

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-ink">{t('UI_COMAKERS')}</h2>
        {canEdit && <button onClick={() => setEditing('new')} className={ROW_BUTTON_NEUTRAL}>{t('UI_ADD_COMAKER')}</button>}
      </div>
      {coMakers.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-6 text-base text-muted">{t('UI_NO_COMAKERS')}</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {coMakers.map(item => (
            <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-ink">{fullName(item)}</p>
                  {item.relationship && <p className="text-sm text-muted">{item.relationship}</p>}
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(item)} className={ROW_BUTTON_NEUTRAL}>{t('UI_EDIT')}</button>
                    <ConfirmAction
                      label={t('UI_REMOVE')}
                      title={t('UI_REMOVE_COMAKER', { name: fullName(item) })}
                      message={t('UI_REMOVE_COMAKER_MESSAGE')}
                      action={removeCoMaker.bind(null, loanId, item.id)}
                      lock={{ type: 'LOAN', id: loanId }}
                    />
                  </div>
                )}
              </div>
              <dl className="grid gap-x-6 gap-y-2 text-base sm:grid-cols-[max-content_1fr]">
                {([
                  ['UI_BIRTH_DATE', item.birthDate ? formatDate(item.birthDate) : ''],
                  ['UI_MOBILE_NUMBER', item.contactNo],
                  ['UI_EMAIL', item.email],
                  ['UI_STREET_ADDRESS', item.address],
                  ['UI_ID_TYPE', item.idType ? `${item.idType}${item.hasIdNumber ? ` · ${t('UI_ID_NUMBER_ON_FILE')}` : ''}` : ''],
                ] as [string, string][]).map(([caption, value]) => (
                  <div key={caption} className="contents">
                    <dt className="text-muted">{t(caption)}</dt>
                    <dd className="text-ink">{value || '—'}</dd>
                  </div>
                ))}
              </dl>
              {item.idImgPath && (
                <a href={`/files/loan-comaker/${loanId}/${item.id}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-accent-strong hover:underline">
                  {t('UI_VIEW_ID_IMAGE')}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
      {editing && (
        <CoMakerDialog
          key={editing === 'new' ? 'new' : editing.id}
          loanId={loanId}
          loanNo={loanNo}
          saved={editing === 'new' ? null : editing}
          required={required}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}

interface CoMakerDialogProps {
  loanId: number
  loanNo: string
  saved: CoMaker | null
  required: Record<string, boolean>
  onClose: () => void
}

function CoMakerDialog({ loanId, loanNo, saved, required, onClose }: CoMakerDialogProps) {
  const [draft, setDraft] = useState<CoMakerDraft>(() => (saved ? draftOf(saved) : blankCoMaker()))

  return (
    <FormDialog
      title={saved ? t('UI_EDIT_COMAKER_OF_LOAN', { loanNo }) : t('UI_ADD_COMAKER_TO_LOAN', { loanNo })}
      action={saveCoMaker.bind(null, loanId, saved?.id ?? null)}
      onClose={onClose}
      lock={{ type: 'LOAN', id: loanId }}
      wide
    >
      <input type="hidden" name="CoMaker" value={JSON.stringify(payloadOf(draft))} />
      <CoMakerInputs
        draft={draft}
        onChange={setDraft}
        required={required}
        saved={Boolean(saved)}
        viewHref={saved?.idImgPath ? `/files/loan-comaker/${loanId}/${saved.id}` : undefined}
      />
    </FormDialog>
  )
}
