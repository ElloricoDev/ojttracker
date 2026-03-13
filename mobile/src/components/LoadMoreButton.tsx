import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { appTheme } from '../theme';

type LoadMoreButtonProps = {
  isLoading: boolean;
  onPress: () => void;
  disabled?: boolean;
};

export default function LoadMoreButton({ isLoading, onPress, disabled = false }: LoadMoreButtonProps) {
  return (
    <Pressable
      disabled={disabled || isLoading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        (disabled || isLoading) && styles.buttonDisabled,
        pressed && !(disabled || isLoading) ? styles.buttonPressed : null,
      ]}
    >
      {isLoading ? <ActivityIndicator size="small" color={appTheme.colors.surface} /> : null}
      <Text style={styles.label}>{isLoading ? 'Loading...' : 'Load more'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    minWidth: 140,
    borderRadius: 10,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    backgroundColor: appTheme.colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: appTheme.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  label: {
    color: appTheme.colors.surface,
    fontWeight: '600',
    fontSize: 14,
  },
});
