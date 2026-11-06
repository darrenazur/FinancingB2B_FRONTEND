'use client'

import { useState } from 'react'
import { assignPartner } from '../../app/partners/actions'
import type { Option, Partner } from '../../lib/api/financing'
import { ROW_BUTTON_NEUTRAL } from '../actions/rowButton'
import FormDialog, { Field, INPUT, useFields } from '../forms/FormDialog'

interface AssignActionProps {
  partner: Partner
  users: Option[]
}

export default function AssignAction({ partner, users }: AssignActionProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)} className={ROW_BUTTON_NEUTRAL} aria-label={`Assign ${partner.name}`}>
        Assign
      </button>
      {open && <AssignForm partner={partner} users={users} onClose={() => setOpen(false)} />}
    </>
  )
}

function AssignForm({ partner, users, onClose }: AssignActionProps & { onClose: () => void }) {
  const { field } = useFields({ AssignedUserID: partner.assignedUserId ? String(partner.assignedUserId) : '' })

  return (
    <FormDialog title={`Assign ${partner.name}`} action={assignPartner.bind(null, partner.id)} onClose={onClose} lock={{ type: 'PARTNER', id: partner.id }}>
      <Field label="Assigned to" hint="A user with own-record access sees this partner and their loans.">
        <select {...field('AssignedUserID')} className={INPUT}>
          <option value="">Nobody</option>
          {users.map(user => <option key={user.id} value={user.id}>{user.label}</option>)}
        </select>
      </Field>
    </FormDialog>
  )
}
