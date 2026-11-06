import { LockState } from './useRecordLock'

const noticeFor = (lock: LockState) => {
  if (lock.status === 'waiting') return 'Checking who is editing this record…'
  if (lock.status === 'lost') return 'Your edit time ended, or an administrator released this record. Your changes were not saved.'
  if (lock.status === 'blocked' && lock.lockedBy) return `Being edited by ${lock.lockedBy}. You can still view this record.`
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
          Close
        </button>
      </div>
    </>
  )
}
