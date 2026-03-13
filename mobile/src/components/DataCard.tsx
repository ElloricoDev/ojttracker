import { PropsWithChildren, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../theme';
import { useResponsive } from '../theme/responsive';
import { useTheme } from '../theme/ThemeProvider';

type DataCardProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  onPress?: () => void;
}>;

export default function DataCard({ children, title, subtitle, icon, onPress }: DataCardProps) {
  const { s } = useResponsive();
  const { colors } = useTheme();
  const styles = getStyles(s, colors);

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && !!onPress ? styles.cardPressed : null]}
    >
      {title ? (
        <View style={styles.titleRow}>
          {icon ? <View style={styles.titleIcon}>{icon}</View> : null}
          <Text style={styles.title}>{title}</Text>
        </View>
      ) : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.body}>{children}</View>
    </Pressable>
  );
}

const getStyles = (s: (value: number) => number, colors: typeof appTheme.colors) =>
  StyleSheet.create({
  card: {
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: s(appTheme.spacing.md),
    gap: s(appTheme.spacing.sm),
  },
  cardPressed: {
    opacity: 0.85,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(appTheme.spacing.sm),
  },
  titleIcon: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  title: {
    fontSize: s(16),
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: s(13),
    color: colors.mutedText,
  },
  body: {
    gap: s(appTheme.spacing.xs),
  },
});
