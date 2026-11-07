'use client'

import { useState } from 'react'
import { assignPartner } from '../../app/partners/actions'
import type { Option, Partner } from '../../lib/api/financing'
import { ROW_BUTTON_NEUTRAL } from '../actions/rowButton'
import FormDialog, { Field, INPUT, useFields } from '../forms/FormDialog'
import { t } from '../../lib/captions/t'

interface AssignActionProps {
  partner: Partner
  users: Option[]
}

export default function AssignAction({ partner, users }: AssignActionProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)} className={ROW_BUTTON_NEUTRAL} aria-label={t('UI_ASSIGN', { name: partner.name })}>
        {t('UI_ASSIGN_2')}
      </button>
      {open && <AssignForm partner={partner} users={users} onClose={() => setOpen(false)} />}
    </>
  )
}

function AssignForm({ partner, users, onClose }: AssignActionProps & { onClose: () => void }) {
  const { field } = useFields({ AssignedUserID: partner.assignedUserId ? String(partner.assignedUserId) : '' })

  return (
    <FormDialog title={t('UI_ASSIGN', { name: partner.name })} action={assignPartner.bind(null, partner.id)} onClose={onClose} lock={{ type: 'PARTNER', id: partner.id }}>
      <Field label={t('UI_ASSIGNED_TO')} hint={t('UI_A_USER_WITH_OWN_RECORD_ACCESS_SEES_THIS_PARTNER_AND_THEIR')}>
        <select {...field('AssignedUserID')} className={INPUT}>
          <option value="">{t('UI_NOBODY')}</option>
          {users.map(user => <option key={user.id} value={user.id}>{user.label}</option>)}
        </select>
      </Field>
    </FormDialog>
  )
}
