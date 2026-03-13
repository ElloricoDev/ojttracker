import { StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../theme';
import { useResponsive } from '../theme/responsive';

type KeyValueRowProps = {
  label: string;
  value: string;
};

export default function KeyValueRow({ label, value }: KeyValueRowProps) {
  const { s } = useResponsive();
  const styles = getStyles(s);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const getStyles = (s: (value: number) => number) =>
  StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: s(appTheme.spacing.sm),
  },
  label: {
    flex: 1,
    fontSize: s(13),
    color: appTheme.colors.mutedText,
    fontWeight: '500',
  },
  value: {
    flex: 1,
    fontSize: s(13),
    color: appTheme.colors.text,
    textAlign: 'right',
  },
});
