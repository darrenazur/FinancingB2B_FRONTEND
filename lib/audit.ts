export interface Audit {
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

type AuditValue = string | number | boolean | null

export interface AuditRow {
  CreatedDt?: AuditValue
  CreatedBy?: AuditValue
  UpdatedDt?: AuditValue
  UpdatedBy?: AuditValue
}

export function readAudit(row: AuditRow): Audit {
  return {
    createdAt: String(row.CreatedDt ?? ''),
    createdBy: String(row.CreatedBy ?? ''),
    updatedAt: String(row.UpdatedDt ?? ''),
    updatedBy: String(row.UpdatedBy ?? ''),
  }
}
