import PageHeader from '../../../components/PageHeader'
import ChangePasswordForm from '../../../components/security/ChangePasswordForm'
import { getCurrentUser } from '../../../lib/api/session'
import { t } from '../../../lib/captions/t'

export default async function ChangePasswordPage() {
  const user = await getCurrentUser()

  return (
    <>
      <PageHeader
        title={t('UI_CHANGE_PASSWORD')}
        description={user?.mustChangePassword ? t('UI_SET_YOUR_OWN_PASSWORD_BEFORE_YOU_CONTINUE') : t('UI_OTHER_SESSIONS_ON_YOUR_ACCOUNT_WILL_END')}
      />
      <ChangePasswordForm />
    </>
  )
}
