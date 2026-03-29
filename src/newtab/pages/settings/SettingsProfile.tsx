import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import UiButton from '@/components/ui/UiButton';
import UiSpinner from '@/components/ui/UiSpinner';

export default function SettingsProfile() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Placeholder - real implementation would use userStore
  const user = null as any;
  const userRetrieved = true;

  if (!userRetrieved) {
    return (
      <div className="flex flex-col items-center justify-center p-16">
        <UiSpinner color="text-accent" size={32} />
        <p>{t('settings.profile.loading')}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl">
        <div className="rounded-lg border p-8 text-center dark:border-gray-700">
          <h3 className="mb-2 text-xl font-semibold">{t('settings.profile.notSignedIn')}</h3>
          <p className="mb-6 text-gray-600 dark:text-gray-300">{t('settings.profile.signInDesc')}</p>
        </div>
      </div>
    );
  }

  const displayName = user?.username || 'User';
  const userEmail = user?.email || '';
  const userAvatar = !avatarError ? user?.avatar_url : null;
  const userInitials = (user?.username || 'User').charAt(0).toUpperCase();
  const userTeams = user?.teams || [];

  async function handleSignOut() {
    try {
      setLoading(true);
      // await userStore.signOut();
      sessionStorage.removeItem('user-profile');
      sessionStorage.removeItem('shared-workflows');
      sessionStorage.removeItem('user-workflows');
      sessionStorage.removeItem('backup-workflows');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="rounded-lg border p-8 dark:border-gray-700">
        <div className="mb-6 flex items-center">
          <div
            className="h-20 w-20 shrink-0 overflow-hidden rounded-full"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={`${displayName}'s avatar`}
                className="h-full w-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-white">
                {userInitials}
              </div>
            )}
          </div>
          <div className="ml-6 flex-1">
            <h3 className="text-xl font-semibold">{displayName}</h3>
            {userEmail && <p className="text-sm text-gray-600">{userEmail}</p>}
            {userTeams.length > 0 && (
              <div className="mt-2 inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                <i className="ri-team-line mr-1" />
                <span>{t('settings.profile.teamsCount', { count: userTeams.length })}</span>
              </div>
            )}
          </div>
        </div>
        <div className="mb-6 flex items-start rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <i className="ri-alert-line mr-2 mt-0.5 text-yellow-500" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">{t('settings.profile.warningMessage')}</p>
        </div>
        <div className="border-t pt-6 dark:border-gray-700">
          <UiButton
            variant="danger"
            className="w-full"
            loading={loading}
            disabled={loading}
            onClick={handleSignOut}
          >
            <i className={`${loading ? 'ri-loader-4-line animate-spin' : 'ri-logout-circle-r-line'} mr-2`} />
            {loading ? t('settings.profile.signingOut') : t('settings.profile.signOut')}
          </UiButton>
          <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
            {t('settings.profile.signOutNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
