import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { confirmPasswordReset } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useConfig } from '../../contexts/ConfigContext';
import Message from '../Message';

interface PasswordResetProps {
  oobCode: string;
}

const PasswordReset = ({ oobCode }: PasswordResetProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'input' | 'success' | 'error'>('input');
  const [error, setError] = useState<string | null>(null);
  const { auth } = useAuth();
  const { t } = useTranslation();
  const { pages } = useConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError(t('passwordsNoMatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('passwordMismatch'));
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : t('passwordUpdateError'));
    }
  };

  if (status === 'success') {
    return (
      <div>
        <Message type="success">{t('passwordUpdateSuccess')}</Message>
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

  if (status === 'error') {
    return <Message type="error">{error || t('passwordUpdateError')}</Message>;
  }

  return (
    <div>
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {t('resetPassword')}
        </h2>
      </div>
      {error && <div className="text-red-500 text-center mt-2">{error}</div>}
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              {t('newPassword')}
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
              minLength={6}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              {t('confirmPassword')}
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
              minLength={6}
            />
          </div>
        </div>
        <div>
          <button
            type="submit"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {t('resetPassword')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PasswordReset;
