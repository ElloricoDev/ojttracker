import { StyleSheet, Text, View } from 'react-native';
import { useResponsive } from '../theme/responsive';

type StatusBadgeProps = {
  status: string;
};

function toneForStatus(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  const normalized = status.toLowerCase();

  if (
    normalized.includes('approved') ||
    normalized.includes('active') ||
    normalized.includes('verified') ||
    normalized.includes('read')
  ) {
    return 'success';
  }

  if (normalized.includes('pending') || normalized.includes('submitted')) {
    return 'warning';
  }

  if (
    normalized.includes('rejected') ||
    normalized.includes('overdue') ||
    normalized.includes('failed') ||
    normalized.includes('missing')
  ) {
    return 'danger';
  }

  return 'neutral';
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((segment) =>
      segment.length > 0 ? segment[0].toUpperCase() + segment.slice(1).toLowerCase() : segment
    )
    .join(' ');
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { s } = useResponsive();
  const styles = getStyles(s);
  const tone = toneForStatus(status);

  return (
    <View
      style={[
        styles.badge,
        tone === 'success'
          ? styles.success
          : tone === 'warning'
            ? styles.warning
            : tone === 'danger'
              ? styles.danger
              : null,
      ]}
    >
      <Text
        style={[
          styles.label,
          tone === 'success'
            ? styles.successLabel
            : tone === 'warning'
              ? styles.warningLabel
              : tone === 'danger'
                ? styles.dangerLabel
                : styles.neutralLabel,
        ]}
      >
        {formatStatus(status)}
      </Text>
    </View>
  );
}

const getStyles = (s: (value: number) => number) =>
  StyleSheet.create({
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: s(10),
    paddingVertical: s(4),
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  label: {
    fontSize: s(12),
    fontWeight: '600',
  },
  success: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  warning: {
    backgroundColor: '#FEF9C3',
    borderColor: '#FDE047',
  },
  danger: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  successLabel: {
    color: '#166534',
  },
  warningLabel: {
    color: '#854D0E',
  },
  dangerLabel: {
    color: '#991B1B',
  },
  neutralLabel: {
    color: '#334155',
  },
});
