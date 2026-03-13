import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { me, type AuthUser } from '../api/auth';
import DataCard from '../components/DataCard';
import InfoStateCard from '../components/InfoStateCard';
import KeyValueRow from '../components/KeyValueRow';
import StudentScreenLayout from '../components/StudentScreenLayout';
import { appTheme } from '../theme';
import { getApiErrorMessage } from '../utils/errors';
import { formatDateTime } from '../utils/formatters';

type ProfileScreenProps = {
  user: AuthUser | null;
  onLogout: () => Promise<void>;
};

export default function ProfileScreen({ user, onLogout }: ProfileScreenProps) {
  const [profile, setProfile] = useState<AuthUser | null>(user);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      const currentUser = await me();
      setProfile(currentUser);
      setError(null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load profile details.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile('initial');
  }, [loadProfile]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);

    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  }, [onLogout]);

  return (
    <StudentScreenLayout
      title="Profile"
      subtitle="Your authenticated student account details."
      refreshing={isRefreshing}
      onRefresh={() => {
        void loadProfile('refresh');
      }}
    >
      {isLoading && !profile ? (
        <DataCard>
          <ActivityIndicator size="large" color={appTheme.colors.primary} />
          <Text style={styles.helperText}>Loading profile details...</Text>
        </DataCard>
      ) : null}

      {!isLoading && error && !profile ? (
        <InfoStateCard
          tone="error"
          title="Unable to load profile"
          message={error}
          actionLabel="Retry"
          onActionPress={() => {
            void loadProfile('initial');
          }}
        />
      ) : null}

      {profile ? (
        <>
          {error ? (
            <InfoStateCard
              tone="error"
              title="Showing cached profile"
              message={error}
              actionLabel="Retry"
              onActionPress={() => {
                void loadProfile('initial');
              }}
            />
          ) : null}

          <DataCard title={profile.name} subtitle={profile.email}>
            <KeyValueRow label="User ID" value={`${profile.id}`} />
            <KeyValueRow label="Role" value={profile.role ?? 'student'} />
            <KeyValueRow label="Status" value={profile.status ?? 'N/A'} />
            <KeyValueRow
              label="Last Login"
              value={formatDateTime(profile.last_login_at, 'Not available')}
            />
          </DataCard>
        </>
      ) : null}

      {!isLoading && !error && !profile ? (
        <InfoStateCard
          title="No profile data available"
          message="Profile information could not be loaded for this account."
        />
      ) : null}

      <Pressable
        disabled={isLoggingOut}
        onPress={() => {
          void handleLogout();
        }}
        style={({ pressed }) => [
          styles.logoutButton,
          isLoggingOut ? styles.logoutButtonDisabled : null,
          pressed && !isLoggingOut ? styles.logoutButtonPressed : null,
        ]}
      >
        <Text style={styles.logoutText}>{isLoggingOut ? 'Logging out...' : 'Logout'}</Text>
      </Pressable>
    </StudentScreenLayout>
  );
}

const styles = StyleSheet.create({
  helperText: {
    fontSize: 14,
    color: appTheme.colors.mutedText,
  },
  logoutButton: {
    borderRadius: 10,
    backgroundColor: '#DC2626',
    paddingVertical: appTheme.spacing.sm + 2,
    alignItems: 'center',
  },
  logoutButtonDisabled: {
    opacity: 0.65,
  },
  logoutButtonPressed: {
    opacity: 0.85,
  },
  logoutText: {
    color: appTheme.colors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
});
