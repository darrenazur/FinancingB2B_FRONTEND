import 'server-only'
import { Audit, AuditRow, readAudit } from '../audit'
import { getList } from './client'

export interface AppUser extends Audit {
  id: number
  username: string
  firstName: string
  lastName: string
  email: string
  contactNo: string
  roleId: number
  roleName: string
  active: boolean
  locked: boolean
  temporaryPassword: boolean
}

export interface AppRole extends Audit {
  id: number
  name: string
  description: string
  dataScope: 'ALL' | 'OWN'
  system: boolean
  permissions: string[]
}

export interface Permission {
  code: string
  moduleName: string
  description: string
}

interface UserRow extends AuditRow {
  AdminUserID: number
  Username: string
  FirstName: string
  LastName: string
  Email: string
  ContactNo: string
  RoleID: number
  RoleName: string
  IsActive: boolean
  IsLocked: number
  MustChangePassword: boolean
}

interface RoleRow extends AuditRow {
  RoleID: number
  RoleName: string
  Description: string | null
  DataScope: 'ALL' | 'OWN'
  IsSystem: boolean
  Permissions: string[]
}

interface PermissionRow {
  PermissionCd: string
  ModuleName: string
  Description: string
}

export interface RecordLock {
  key: number
  type: string
  id: number
  kind: string
  recordName: string
  holderName: string
  holderUsername: string
  lockedAt: string
  expiresAt: string
  active: boolean
}

interface LockRow {
  EntityType: string
  EntityID: number
  Kind: string
  RecordName: string
  HolderName: string
  HolderUsername: string
  LockedAt: string
  ExpiresAt: string
  Active: boolean
}

export async function getLocks(): Promise<RecordLock[]> {
  const rows = await getList<LockRow>('/lock-view')
  return rows.map((row, index) => ({
    key: index,
    type: row.EntityType,
    id: row.EntityID,
    kind: row.Kind,
    recordName: row.RecordName,
    holderName: row.HolderName,
    holderUsername: row.HolderUsername,
    lockedAt: row.LockedAt,
    expiresAt: row.ExpiresAt,
    active: row.Active,
  }))
}

export async function getUsers(): Promise<AppUser[]> {
  const rows = await getList<UserRow>('/user-view')
  return rows.map(row => ({
    id: row.AdminUserID,
    username: row.Username,
    firstName: row.FirstName,
    lastName: row.LastName,
    email: row.Email,
    contactNo: row.ContactNo,
    roleId: row.RoleID,
    roleName: row.RoleName,
    active: Boolean(row.IsActive),
    locked: Boolean(row.IsLocked),
    temporaryPassword: Boolean(row.MustChangePassword),
    ...readAudit(row),
  }))
}

export async function getRoles(): Promise<AppRole[]> {
  const rows = await getList<RoleRow>('/role-view')
  return rows.map(row => ({
    id: row.RoleID,
    name: row.RoleName,
    description: row.Description ?? '',
    dataScope: row.DataScope,
    system: Boolean(row.IsSystem),
    permissions: row.Permissions,
    ...readAudit(row),
  }))
}

export async function getPermissions(): Promise<Permission[]> {
  const rows = await getList<PermissionRow>('/permission-view')
  return rows.map(row => ({ code: row.PermissionCd, moduleName: row.ModuleName, description: row.Description }))
}
