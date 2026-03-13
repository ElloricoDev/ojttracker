import { Button, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { appTheme } from '../theme';
import { useResponsive } from '../theme/responsive';

type InfoStateCardTone = 'neutral' | 'error';

type InfoStateCardProps = {
  title: string;
  message: string;
  tone?: InfoStateCardTone;
  actionLabel?: string;
  onActionPress?: () => void;
};

export default function InfoStateCard({
  title,
  message,
  tone = 'neutral',
  actionLabel,
  onActionPress,
}: InfoStateCardProps) {
  const { s } = useResponsive();
  const styles = getStyles(s);
  const iconName = tone === 'error' ? 'alert-circle-outline' : 'information-outline';
  const iconColor = tone === 'error' ? '#B91C1C' : '#1D4ED8';

  return (
    <View style={[styles.card, tone === 'error' ? styles.errorCard : styles.neutralCard]}>
      <View style={styles.titleRow}>
        <MaterialCommunityIcons name={iconName} size={20} color={iconColor} />
        <Text style={[styles.title, tone === 'error' ? styles.errorTitle : null]}>{title}</Text>
      </View>
      <Text style={[styles.message, tone === 'error' ? styles.errorMessage : null]}>{message}</Text>
      {actionLabel && onActionPress ? <Button title={actionLabel} onPress={onActionPress} /> : null}
    </View>
  );
}

const getStyles = (s: (value: number) => number) =>
  StyleSheet.create({
  card: {
    borderRadius: s(12),
    padding: s(appTheme.spacing.md),
    borderWidth: 1,
    gap: s(appTheme.spacing.sm),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(appTheme.spacing.xs + 2),
  },
  neutralCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  title: {
    fontSize: s(16),
    fontWeight: '700',
    color: '#1D4ED8',
  },
  errorTitle: {
    color: '#B91C1C',
  },
  message: {
    color: '#1E40AF',
    fontSize: s(14),
  },
  errorMessage: {
    color: '#7F1D1D',
  },
});
