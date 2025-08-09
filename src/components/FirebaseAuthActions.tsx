import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import EmailVerification from './auth/EmailVerification';
import PasswordReset from './auth/PasswordReset';
import EmailChange from './auth/EmailChange';
import Message from './Message';

const FirebaseAuthActions = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  if (!mode || !oobCode) {
    return <Message type="error">{t('invalidOrMissingParameters')}</Message>;
  }

  switch (mode) {
    case 'verifyEmail':
      return <EmailVerification oobCode={oobCode} />;
    case 'resetPassword':
      return <PasswordReset oobCode={oobCode} />;
    case 'verifyAndChangeEmail':
    case 'recoverEmail':
      return <EmailChange oobCode={oobCode} mode={mode} />;
    default:
      return <Message type="error">{t('unsupportedOperation')}</Message>;
  }
};

export default FirebaseAuthActions;
