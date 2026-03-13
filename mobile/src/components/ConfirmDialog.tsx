import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../theme';
import { useResponsive } from '../theme/responsive';
import { useTheme } from '../theme/ThemeProvider';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { s } = useResponsive();
  const { colors } = useTheme();
  const styles = getStyles(s, colors);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable style={styles.scrim} onPress={onCancel} />
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={[styles.dot, destructive && styles.dotDanger]} />
            <Text style={styles.title}>{title}</Text>
          </View>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={({ pressed }) => [
              styles.cancelButton,
              pressed && styles.buttonPressed,
            ]}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={({ pressed }) => [
              styles.confirmButton,
              destructive && styles.confirmDanger,
              pressed && styles.buttonPressed,
            ]}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (s: (value: number) => number, colors: typeof appTheme.colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(2, 6, 23, 0.6)',
    },
    card: {
      width: '84%',
      borderRadius: s(18),
      backgroundColor: colors.surface,
      padding: s(appTheme.spacing.lg),
      gap: s(appTheme.spacing.sm),
      borderWidth: 1,
      borderColor: colors.borderLight,
      shadowColor: '#0F172A',
      shadowOpacity: 0.18,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(appTheme.spacing.xs),
    },
    dot: {
      width: s(10),
      height: s(10),
      borderRadius: s(5),
      backgroundColor: colors.primary,
    },
    dotDanger: {
      backgroundColor: colors.error,
    },
    title: {
      fontSize: s(16),
      fontWeight: '700',
      color: colors.text,
    },
    message: {
      fontSize: s(13),
      color: colors.mutedText,
      lineHeight: s(18),
    },
    actions: {
      flexDirection: 'row',
      gap: s(appTheme.spacing.xs),
    },
    cancelButton: {
      flex: 1,
      borderRadius: s(12),
      paddingVertical: s(appTheme.spacing.sm),
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.surfaceAlt,
    },
    cancelText: {
      fontSize: s(13),
      fontWeight: '600',
      color: colors.text,
    },
    confirmButton: {
      flex: 1,
      borderRadius: s(12),
      paddingVertical: s(appTheme.spacing.sm),
      alignItems: 'center',
      backgroundColor: colors.primary,
    },
    confirmDanger: {
      backgroundColor: colors.error,
    },
    confirmText: {
      fontSize: s(13),
      fontWeight: '600',
      color: '#FFFFFF',
    },
    buttonPressed: {
      opacity: 0.85,
    },
  });
