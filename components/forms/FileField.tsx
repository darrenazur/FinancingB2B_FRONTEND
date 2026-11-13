'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { Field, INPUT } from './FormDialog'
import { t } from '../../lib/captions/t'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT = { id: 'image/jpeg,image/png', selfie: 'image/jpeg,image/png', proof: 'image/jpeg,image/png,application/pdf', note: 'image/jpeg,image/png,application/pdf' }
const HINT = { id: 'UI_JPG_OR_PNG_UP_TO_5MB', selfie: 'UI_JPG_OR_PNG_UP_TO_5MB', proof: 'UI_JPG_PNG_OR_PDF_UP_TO_5MB', note: 'UI_JPG_PNG_OR_PDF_UP_TO_5MB' }

interface FileFieldProps {
  label: string
  name: string
  kind: keyof typeof ACCEPT
  value: string
  onChange: (key: string) => void
  // Opens the file saved on this record, if there is one.
  viewHref?: string
  required?: boolean
}

// Uploads as soon as a file is picked. The form only carries the key the API gives back.
export default function FileField({ label, name, kind, value, onChange, viewHref, required }: FileFieldProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [replaced, setReplaced] = useState(false)

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  const clear = () => {
    setPreview(null)
    setReplaced(true)
    onChange('')
  }

  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setError(null)
    if (!file) return
    if (file.size > MAX_BYTES) {
      clear()
      setError(t('UI_THIS_FILE_IS_OVER_5MB'))
      return
    }

    setUploading(true)
    try {
      const response = await fetch(`/files/upload/${kind}`, { method: 'POST', body: file })
      const result = await response.json()
      if (!result.ok) {
        clear()
        setError(result.error)
        return
      }
      onChange(result.key)
      setReplaced(true)
      setPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null)
    } catch {
      clear()
      setError(t('UI_THE_FILE_DIDNT_UPLOAD_TRY_AGAIN'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <Field label={label} hint={uploading ? t('UI_UPLOADING') : t(HINT[kind])}>
      <input type="hidden" name={name} value={value} />
      <input type="file" accept={ACCEPT[kind]} required={required && !value} onChange={pick} className={INPUT} />
      {error && <span role="alert" className="text-sm font-normal text-bad">{error}</span>}
      {preview && <img src={preview} alt={t('UI_PREVIEW', { label })} className="max-h-40 w-fit rounded-xl border border-line object-contain" />}
      {viewHref && !replaced && (
        <a href={viewHref} target="_blank" rel="noreferrer" className="text-sm font-medium text-accent-strong hover:underline">
          {t('UI_VIEW_CURRENT_FILE')}
        </a>
      )}
    </Field>
  )
}
