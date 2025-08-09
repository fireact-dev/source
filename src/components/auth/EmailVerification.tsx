import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { applyActionCode } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useConfig } from '../../contexts/ConfigContext';
import Message from '../Message';

interface EmailVerificationProps {
  oobCode: string;
}

const EmailVerification = ({ oobCode }: EmailVerificationProps) => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);
  const { auth } = useAuth();
  const { t } = useTranslation();
  const { pages } = useConfig();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await applyActionCode(auth, oobCode);
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : t('failedToVerifyEmail'));
      }
    };

    verifyEmail();
  }, [auth, oobCode, t]);

  if (status === 'verifying') {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">{t('verifyingEmail')}</p>
      </div>
    );
  }

  if (status === 'error') {
    return <Message type="error">{error || t('verificationFailed')}</Message>;
  }

  return (
    <div>
      <Message type="success">{t('emailVerified')}</Message>
      <div className="text-center mt-4">
        <Link
          to={pages.signIn}
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          {t('backToSignIn')}
        </Link>
      </div>
    </div>
  );
};

export default EmailVerification;
