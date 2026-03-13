import { useState } from 'react';
import { Button, StyleSheet, Text } from 'react-native';
import type { AuthUser } from '../api/auth';
import ScreenContainer from '../components/ScreenContainer';
import { appTheme } from '../theme';

type HomeScreenProps = {
  user: AuthUser | null;
  onLogout: () => Promise<void>;
};

export default function HomeScreen({ user, onLogout }: HomeScreenProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>Welcome back, {user?.name ?? 'Student'}.</Text>
      <Text style={styles.meta}>{user?.email ?? 'No email available'}</Text>
      <Text style={styles.meta}>Role: {user?.role ?? 'student'}</Text>
      <Button
        title={isLoggingOut ? 'Logging out...' : 'Logout'}
        onPress={() => {
          void handleLogout();
        }}
        disabled={isLoggingOut}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: appTheme.colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: appTheme.colors.mutedText,
  },
  meta: {
    fontSize: 14,
    color: appTheme.colors.mutedText,
  },
});
