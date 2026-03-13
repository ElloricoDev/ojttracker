import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { appTheme } from '../theme';
import { useResponsive } from '../theme/responsive';

type ToastType = 'success' | 'error' | 'info';

type ToastOptions = {
  type?: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
};

type ToastContextValue = {
  show: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

export default function ToastProvider({ children }: PropsWithChildren) {
  const { s } = useResponsive();
  const insets = useSafeAreaInsets();
  const styles = getStyles(s);
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-6)).current;
  const hideTimer = useRef<NodeJS.Timeout | null>(null);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -6, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      setToast(null);
    });
  }, [opacity, translateY]);

  const show = useCallback(
    (options: ToastOptions) => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
      setToast({ type: 'info', durationMs: 2400, ...options });
      opacity.setValue(0);
      translateY.setValue(-6);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
      const duration = options.durationMs ?? 2400;
      hideTimer.current = setTimeout(hideToast, duration);
    },
    [hideToast, opacity, translateY]
  );

  useEffect(() => {
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  const toastStyles = toast ? getToastStyles(toast.type ?? 'info') : null;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View pointerEvents="box-none" style={styles.host}>
          <Animated.View
            style={[
              styles.toast,
              toastStyles?.container,
              {
                marginTop: insets.top + s(8),
                opacity,
                transform: [{ translateY }],
              },
            ]}
          >
            <View style={[styles.iconBadge, toastStyles?.iconBadge]}>
              <MaterialCommunityIcons
                name={toastStyles?.icon ?? 'information-outline'}
                size={16}
                color={toastStyles?.iconColor ?? '#1D4ED8'}
              />
            </View>
            <View style={styles.textStack}>
              {toast.title ? <Text style={[styles.title, toastStyles?.title]}>{toast.title}</Text> : null}
              <Text style={[styles.message, toastStyles?.message]}>{toast.message}</Text>
            </View>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

const getToastStyles = (type: ToastType) => {
  if (type === 'success') {
    return {
      container: { backgroundColor: '#ECFDF3', borderColor: '#BBF7D0' },
      iconBadge: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
      icon: 'check-circle-outline',
      iconColor: '#15803D',
      title: { color: '#14532D' },
      message: { color: '#14532D' },
    };
  }
  if (type === 'error') {
    return {
      container: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
      iconBadge: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
      icon: 'alert-circle-outline',
      iconColor: '#B91C1C',
      title: { color: '#7F1D1D' },
      message: { color: '#7F1D1D' },
    };
  }
  return {
    container: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
    iconBadge: { backgroundColor: '#DBEAFE', borderColor: '#BFDBFE' },
    icon: 'information-outline',
    iconColor: '#1D4ED8',
    title: { color: '#1E3A8A' },
    message: { color: '#1E3A8A' },
  };
};

const getStyles = (s: (value: number) => number) =>
  StyleSheet.create({
    host: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      alignItems: 'center',
      zIndex: 999,
    },
    toast: {
      width: '88%',
      borderRadius: s(14),
      borderWidth: 1,
      paddingVertical: s(appTheme.spacing.sm),
      paddingHorizontal: s(appTheme.spacing.md),
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(appTheme.spacing.sm),
      shadowColor: '#0F172A',
      shadowOpacity: 0.14,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 5,
    },
    iconBadge: {
      width: s(32),
      height: s(32),
      borderRadius: s(12),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    textStack: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: s(13),
      fontWeight: '700',
    },
    message: {
      fontSize: s(12),
    },
  });
