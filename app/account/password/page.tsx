import PageHeader from '../../../components/PageHeader'
import ChangePasswordForm from '../../../components/security/ChangePasswordForm'
import { getCurrentUser } from '../../../lib/api/session'

export default async function ChangePasswordPage() {
  const user = await getCurrentUser()

  return (
    <>
      <PageHeader
        title="Change password"
        description={user?.mustChangePassword ? 'Set your own password before you continue.' : 'Other sessions on your account will end.'}
      />
      <ChangePasswordForm />
    </>
  )
}
