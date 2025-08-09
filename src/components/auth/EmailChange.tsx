import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { checkActionCode, applyActionCode } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useConfig } from '../../contexts/ConfigContext';
import Message from '../Message';

interface EmailChangeProps {
  oobCode: string;
  mode: 'verifyAndChangeEmail' | 'recoverEmail';
}

const EmailChange = ({ oobCode, mode }: EmailChangeProps) => {
  const [status, setStatus] = useState<'checking' | 'confirming' | 'success' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [emailDetails, setEmailDetails] = useState<{ email: string } | null>(null);
  const { auth } = useAuth();
  const { t } = useTranslation();
  const { pages } = useConfig();

  useEffect(() => {
    const verifyCode = async () => {
      try {
        const info = await checkActionCode(auth, oobCode);
        setEmailDetails({ email: info.data.email || '' });
        setStatus('confirming');
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : t('emailUpdateError'));
      }
    };

    verifyCode();
  }, [auth, oobCode, t]);

  const handleConfirm = async () => {
    try {
      await applyActionCode(auth, oobCode);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : t('emailUpdateError'));
    }
  };

  if (status === 'checking') {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">{t('verifyingRequest')}</p>
      </div>
    );
  }

  if (status === 'error') {
    return <Message type="error">{error || t('emailUpdateError')}</Message>;
  }

  if (status === 'success') {
    return (
      <div>
        <Message type="success">
          {mode === 'recoverEmail' ? t('recoverEmailSuccess') : t('emailUpdateSuccess')}
        </Message>
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
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">
        {mode === 'recoverEmail' ? t('recoverEmailTitle') : t('confirmEmailChange')}
      </h2>
      <p className="mb-4 text-gray-600">
        {mode === 'recoverEmail' 
          ? t('recoverEmailMessage')
          : `${t('confirmEmailChangeTo')} ${emailDetails?.email}`}
      </p>
      <button
        onClick={handleConfirm}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {mode === 'recoverEmail' ? t('recoverEmailTitle') : t('confirmEmailChange')}
      </button>
    </div>
  );
};

export default EmailChange;
