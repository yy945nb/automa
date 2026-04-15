import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '@/stores/user';

const SettingsProfile: React.FC = () => {
  const { t } = useTranslation();
  const userStore = useUserStore();

  const [loading, setLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const displayName = useMemo(
    () => userStore.user?.username || 'User',
    [userStore.user]
  );

  const userEmail = useMemo(
    () => userStore.user?.email || '',
    [userStore.user]
  );

  const userAvatar = useMemo(() => {
    if (avatarError) return null;
    return userStore.user?.avatar_url || null;
  }, [userStore.user, avatarError]);

  const userInitials = useMemo(() => {
    if (!userStore.user) return 'U';
    const username = userStore.user?.username || 'User';
    return username.charAt(0).toUpperCase();
  }, [userStore.user]);

  const userTeams = useMemo(
    () => userStore.user?.teams || [],
    [userStore.user]
  );

  const handleSignOut = async () => {
    if (loading || isSigningOut) return;

    const confirmed = window.confirm(
      t('settings.profile.signOutConfirmMessage')
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      setIsSigningOut(true);

      await userStore.signOut();

      sessionStorage.removeItem('user-profile');
      sessionStorage.removeItem('shared-workflows');
      sessionStorage.removeItem('user-workflows');
      sessionStorage.removeItem('backup-workflows');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
      setIsSigningOut(false);
    }
  };

  // Loading state
  if (!userStore.retrieved) {
    return (
      <div className="max-w-xl">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem',
          }}
        >
          <div
            className="ui-spinner text-accent"
            style={{ width: 32, height: 32 }}
          />
          <p>{t('settings.profile.loading')}</p>
        </div>
      </div>
    );
  }

  // Not signed in
  if (!userStore.user) {
    return (
      <div className="max-w-xl">
        <div className="rounded-lg border bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-2 text-xl font-semibold">
            {t('settings.profile.notSignedIn')}
          </h3>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            {t('settings.profile.signInDesc')}
          </p>
        </div>
      </div>
    );
  }

  // Signed in
  return (
    <div className="max-w-xl">
      <div className="rounded-lg border bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
        {/* Profile header */}
        <div className="mb-6 flex items-center">
          <div
            className="flex-shrink-0 overflow-hidden rounded-full"
            style={{
              width: 80,
              height: 80,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
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
            <h3 className="text-2xl font-semibold">{displayName}</h3>
            {userEmail && (
              <p className="text-sm text-gray-500">{userEmail}</p>
            )}
            {userTeams.length > 0 && (
              <div className="mt-3 inline-flex items-center rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                <span
                  className="remix-icon mr-1"
                  data-icon="riTeamLine"
                  style={{ fontSize: 16 }}
                />
                <span>
                  {t('settings.profile.teamsCount', {
                    count: userTeams.length,
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Warning */}
        <div className="mb-6 flex items-start rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-stone-500 dark:border-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
          <span
            className="remix-icon mr-2 text-yellow-500"
            data-icon="riAlertLine"
            style={{ fontSize: 20 }}
          />
          <p>{t('settings.profile.warningMessage')}</p>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
          <button
            className="btn variant-danger flex w-full items-center justify-center font-semibold"
            style={{ minHeight: 48 }}
            disabled={loading}
            onClick={handleSignOut}
          >
            <span
              className={`remix-icon mr-2 ${loading ? 'animate-spin' : ''}`}
              data-icon={loading ? 'riLoader4Line' : 'riLogoutCircleRLine'}
            />
            {loading
              ? t('settings.profile.signingOut')
              : t('settings.profile.signOut')}
          </button>
          <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
            {t('settings.profile.signOutNote')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsProfile;
