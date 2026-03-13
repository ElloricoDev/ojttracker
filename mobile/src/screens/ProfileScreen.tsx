import { useCallback, useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { me, type AuthUser } from '../api/auth';
import ConfirmDialog from '../components/ConfirmDialog';
import DataCard from '../components/DataCard';
import InfoStateCard from '../components/InfoStateCard';
import KeyValueRow from '../components/KeyValueRow';
import StudentScreenLayout from '../components/StudentScreenLayout';
import { useToast } from '../components/ToastProvider';
import { appTheme } from '../theme';
import { useResponsive } from '../theme/responsive';
import { useTheme } from '../theme/ThemeProvider';
import { getApiErrorMessage } from '../utils/errors';
import { formatDateTime } from '../utils/formatters';

type ProfileScreenProps = {
  user: AuthUser | null;
  onLogout: () => Promise<void>;
};

export default function ProfileScreen({ user, onLogout }: ProfileScreenProps) {
  const { s } = useResponsive();
  const { colors } = useTheme();
  const styles = getStyles(s, colors);
  const toast = useToast();
  const [profile, setProfile] = useState<AuthUser | null>(user);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
      toast.show({ type: 'success', title: 'Logged out', message: 'You have been signed out.' });
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Unable to log out right now.');
      toast.show({ type: 'error', title: 'Logout failed', message });
    } finally {
      setIsLoggingOut(false);
    }
  }, [onLogout, toast]);

  return (
    <StudentScreenLayout
      title="Profile"
      subtitle="Your authenticated student account details."
      headerIconName="account-circle-outline"
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

          <DataCard
            title={profile.name}
            subtitle={profile.email}
            icon={<MaterialCommunityIcons name="account-circle-outline" size={16} color="#1D4ED8" />}
          >
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profile.name
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join('')}
                </Text>
              </View>
              <View style={styles.profileMeta}>
                <Text style={styles.profileName}>{profile.name}</Text>
                <Text style={styles.profileEmail}>{profile.email}</Text>
              </View>
            </View>
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
        onPress={() => setShowLogoutConfirm(true)}
        style={({ pressed }) => [
          styles.logoutButton,
          isLoggingOut ? styles.logoutButtonDisabled : null,
          pressed && !isLoggingOut ? styles.logoutButtonPressed : null,
        ]}
      >
        <MaterialCommunityIcons name="logout" size={16} color="#FFFFFF" />
        <Text style={styles.logoutText}>{isLoggingOut ? 'Logging out...' : 'Logout'}</Text>
      </Pressable>

      <ConfirmDialog
        visible={showLogoutConfirm}
        title="Log out"
        message="You will need to sign in again to access your account."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        destructive
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          void handleLogout();
        }}
      />
    </StudentScreenLayout>
  );
}

const getStyles = (s: (value: number) => number, colors: typeof appTheme.colors) =>
  StyleSheet.create({
    helperText: {
      fontSize: s(14),
      color: colors.mutedText,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(appTheme.spacing.sm),
      paddingBottom: s(appTheme.spacing.xs),
    },
    avatar: {
      width: s(48),
      height: s(48),
      borderRadius: s(16),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.primaryRing,
    },
    avatarText: {
      fontSize: s(16),
      fontWeight: '700',
      color: colors.primary,
    },
    profileMeta: {
      flex: 1,
      gap: 2,
    },
    profileName: {
      fontSize: s(16),
      fontWeight: '700',
      color: colors.text,
    },
    profileEmail: {
      fontSize: s(12),
      color: colors.mutedText,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s(appTheme.spacing.xs),
      borderRadius: s(12),
      backgroundColor: colors.error,
      paddingVertical: s(appTheme.spacing.sm),
    },
    logoutButtonDisabled: {
      opacity: 0.65,
    },
    logoutButtonPressed: {
      opacity: 0.85,
    },
    logoutText: {
      color: colors.surface,
      fontSize: s(14),
      fontWeight: '700',
    },
  });
