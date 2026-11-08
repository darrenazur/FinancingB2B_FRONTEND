import { LockState } from './useRecordLock'
import { t } from '../../lib/captions/t'

const noticeFor = (lock: LockState) => {
  if (lock.status === 'waiting') return t('UI_CHECKING_WHO_IS_EDITING_THIS_RECORD')
  if (lock.status === 'lost') return t('UI_YOUR_EDIT_TIME_ENDED_OR_AN_ADMINISTRATOR_RELEASED_THIS')
  if (lock.status === 'blocked' && lock.lockedBy) return t('UI_BEING_EDITED_BY_YOU_CAN_STILL_VIEW_THIS_RECORD', { lockedBy: lock.lockedBy })
  return lock.status === 'blocked' ? lock.error : ''
}

// Stands in for the form until this user holds the record.
export default function LockNotice({ lock, onClose }: { lock: LockState; onClose: () => void }) {
  return (
    <>
      <p role="status" className="mt-4 text-base text-body">{noticeFor(lock)}</p>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-6 py-3 text-base font-medium text-body hover:bg-elevated"
        >
          {t('UI_CLOSE')}
        </button>
      </div>
    </>
  )
}
