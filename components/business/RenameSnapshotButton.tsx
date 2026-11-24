'use client'

import { useState } from 'react'
import { renameSimSnapshot } from '../../app/business/simulation/actions'
import FormDialog, { Field, INPUT, useFields } from '../forms/FormDialog'
import { t } from '../../lib/captions/t'

// Rename a saved snapshot and edit its notes. What was entered and the months stay as saved.
export default function RenameSnapshotButton({ id, name, notes, className }: { id: string; name: string; notes: string; className: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {t('UI_SIM_RENAME')}
      </button>
      {open && <RenameForm id={id} name={name} notes={notes} onClose={() => setOpen(false)} />}
    </>
  )
}

function RenameForm({ id, name, notes, onClose }: { id: string; name: string; notes: string; onClose: () => void }) {
  const { field } = useFields({ Name: name, Notes: notes })

  return (
    <FormDialog title={t('UI_SIM_RENAME_SNAPSHOT', { name })} action={renameSimSnapshot.bind(null, id)} onClose={onClose}>
      <Field label={t('UI_SIM_SNAPSHOT_NAME')}>
        <input className={INPUT} maxLength={100} required {...field('Name')} />
      </Field>
      <Field label={t('UI_SIM_SNAPSHOT_NOTES')}>
        <textarea className={INPUT} maxLength={500} rows={3} {...field('Notes')} />
      </Field>
    </FormDialog>
  )
}
