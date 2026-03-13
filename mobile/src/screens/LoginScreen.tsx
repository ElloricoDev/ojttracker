import { useEffect, useRef, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { useToast } from '../components/ToastProvider';
import { appTheme } from '../theme';
import { API_BASE_URL } from '../utils/env';
import { useTheme } from '../theme/ThemeProvider';

type LoginScreenProps = {
  onLogin: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
  bootstrapError: string | null;
};

export default function LoginScreen({
  onLogin,
  isLoading,
  errorMessage,
  bootstrapError,
}: LoginScreenProps) {
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const keyboardShift = useRef(new Animated.Value(0)).current;
  const toast = useToast();
  const { colors, mode, toggle } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (formError) {
      setFormError(null);
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (formError) {
      setFormError(null);
    }
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const height = event.endCoordinates?.height ?? 0;
      const shift = Math.min(240, Math.max(120, height * 0.55));
      Animated.timing(keyboardShift, {
        toValue: -shift,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      Animated.timing(keyboardShift, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardShift]);

  useEffect(() => {
    if (errorMessage) {
      toast.show({ type: 'error', title: 'Login failed', message: errorMessage });
    }
  }, [errorMessage, toast]);

  useEffect(() => {
    if (bootstrapError) {
      toast.show({ type: 'error', title: 'Session error', message: bootstrapError });
    }
  }, [bootstrapError, toast]);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setFormError('Email and password are required.');
      return;
    }

    const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
    if (!emailLooksValid) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setFormError(null);
    await onLogin(trimmedEmail, password);
  };

  const visibleError = formError ?? errorMessage;
  const networkErrorDetected = (visibleError ?? '').toLowerCase().includes('network');
  const showTroubleshooting = networkErrorDetected;
  const isSubmitDisabled = isLoading || !email.trim() || !password;

  const styles = getStyles(colors);

  return (
    <ScreenContainer scroll={false} keyboardAvoiding={false} withPadding={false}>
      <Animated.View style={[styles.content, { transform: [{ translateY: keyboardShift }] }]}>
        <View style={styles.backgroundGlow} />
        <View style={styles.backgroundOrb} />
        <View style={styles.backgroundGrid} />

        {/* ── Hero ── */}
        <View style={styles.hero}>
          <View style={styles.brandWrap}>
            <View style={styles.brandBg}>
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={30}
                color={colors.primary}
              />
            </View>
            <View style={styles.brandDot} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.title}>OJT Tracker</Text>
            <Text style={styles.subtitle}>Stay on top of hours, reports, and approvals.</Text>
          </View>
        </View>

        {/* ── Form ── */}
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Sign in</Text>
            <Text style={styles.formSubtitle}>Use the credentials provided by your coordinator.</Text>
          </View>
          <Pressable
            onPress={toggle}
            style={styles.themeToggle}
            accessibilityRole="button"
            accessibilityLabel="Toggle theme"
          >
            <MaterialCommunityIcons
              name={mode === 'dark' ? 'weather-sunny' : 'moon-waning-crescent'}
              size={18}
              color={colors.text}
            />
          </Pressable>

            <View style={styles.form}>
              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email address</Text>
                <View style={styles.inputRow}>
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={17}
                    color={colors.mutedText}
                  />
                  <TextInput
                    ref={emailRef}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    keyboardType="email-address"
                    onChangeText={handleEmailChange}
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    placeholder="student@university.edu"
                    placeholderTextColor={colors.subtleText}
                    selectionColor={colors.primary}
                    style={styles.input}
                    value={email}
                    returnKeyType="next"
                    textContentType="emailAddress"
                    accessibilityLabel="Email"
                  />
                  {email.length > 0 && !isLoading && (
                    <Pressable
                      onPress={() => setEmail('')}
                      hitSlop={8}
                      accessibilityLabel="Clear email"
                    >
                      <MaterialCommunityIcons
                        name="close-circle"
                        size={16}
                        color={colors.mutedText}
                      />
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Password</Text>
                  <Text style={styles.passwordHint}>Use your assigned password</Text>
                </View>
                <View style={styles.inputRow}>
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={17}
                    color={colors.mutedText}
                  />
                  <TextInput
                    ref={passwordRef}
                    editable={!isLoading}
                    onChangeText={handlePasswordChange}
                    onSubmitEditing={() => {
                      void handleLogin();
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.subtleText}
                    secureTextEntry={!showPassword}
                    blurOnSubmit={false}
                    selectionColor={colors.primary}
                    style={styles.input}
                    value={password}
                    returnKeyType="done"
                    textContentType="password"
                    accessibilityLabel="Password"
                  />
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    hitSlop={8}
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.mutedText}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Errors */}
              {bootstrapError ? (
                <View style={styles.warningBox}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={15}
                    color={colors.warningText}
                  />
                  <Text style={styles.warningText}>{bootstrapError}</Text>
                </View>
              ) : null}
              {visibleError ? (
                <View style={styles.errorBox}>
                  <MaterialCommunityIcons
                    name="alert-outline"
                    size={15}
                    color={colors.errorText}
                  />
                  <Text style={styles.errorText}>{visibleError}</Text>
                </View>
              ) : null}
              {showTroubleshooting ? (
                <View style={styles.troubleshootBox}>
                    <MaterialCommunityIcons
                      name="wifi-alert"
                      size={16}
                      color={colors.infoText}
                    />
                  <View style={styles.troubleshootTextWrap}>
                    <Text style={styles.troubleshootTitle}>Connection tips</Text>
                    <Text style={styles.troubleshootBody}>
                      - Use the same Wi-Fi for phone and PC.{'\n'}- Keep Laravel server running on
                      port 8001.{'\n'}- Current API: {API_BASE_URL}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Submit */}
              <Pressable
                onPress={() => {
                  void handleLogin();
                }}
                style={({ pressed }) => [
                  styles.submitButton,
                  isSubmitDisabled && styles.submitButtonDisabled,
                  pressed && !isSubmitDisabled && styles.submitButtonPressed,
                ]}
                disabled={isSubmitDisabled}
                accessibilityRole="button"
                accessibilityHint="Signs in to your account"
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={18}
                    color={colors.surface}
                  />
                )}
                <Text style={styles.submitLabel}>
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Secure student workspace</Text>
          <View style={styles.footerBadge}>
            <Text style={styles.footerBadgeText}>v1.0</Text>
          </View>
        </View>

      </Animated.View>
    </ScreenContainer>
  );
}

const getStyles = (colors: typeof appTheme.colors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },

  content: {
    paddingHorizontal: appTheme.layout.screenPadding,
    paddingBottom: appTheme.spacing.xl,
    paddingTop: appTheme.spacing.lg,
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundGlow: {
    position: 'absolute',
    top: -120,
    left: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.primaryLight,
    opacity: 0.35,
  },
  backgroundOrb: {
    position: 'absolute',
    top: 120,
    right: -140,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.infoLight,
    opacity: 0.25,
  },
  backgroundGrid: {
    position: 'absolute',
    inset: 0,
    opacity: 0.25,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },

  /* Hero */
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 24,
  },
  brandWrap: {
    position: 'relative',
    marginBottom: 0,
  },
  brandBg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...appTheme.shadow.sm,
  },
  brandDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.background,
  },
  heroText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.mutedText,
    lineHeight: 20,
  },

  /* Form */
  formCard: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 22,
    backgroundColor: colors.surface,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    ...appTheme.shadow.md,
  },
  formHeader: {
    gap: appTheme.spacing.xs,
    marginBottom: appTheme.spacing.sm,
  },
  themeToggle: {
    position: 'absolute',
    top: appTheme.spacing.sm,
    right: appTheme.spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  formTitle: {
    fontSize: appTheme.fontSize.xl,
    fontWeight: appTheme.fontWeight.bold,
    color: colors.text,
  },
  formSubtitle: {
    fontSize: appTheme.fontSize.base,
    color: colors.mutedText,
    lineHeight: 20,
  },
  form: {
    gap: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedText,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  passwordHint: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.subtleText,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: appTheme.input.height,
    paddingHorizontal: appTheme.input.paddingH,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: appTheme.input.borderRadius,
  },
  input: {
    flex: 1,
    fontSize: appTheme.input.fontSize,
    color: colors.text,
    paddingVertical: 0,
  },

  /* Alerts */
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.warningLight,
    borderRadius: 12,
    padding: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: colors.warningText,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.errorLight,
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.errorText,
    lineHeight: 18,
  },
  troubleshootBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appTheme.spacing.sm,
    backgroundColor: colors.infoLight,
    borderRadius: appTheme.radius.md,
    padding: appTheme.spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.info,
  },
  troubleshootTextWrap: {
    flex: 1,
    gap: appTheme.spacing.xs,
  },
  troubleshootTitle: {
    fontSize: appTheme.fontSize.base,
    fontWeight: appTheme.fontWeight.semibold,
    color: colors.infoText,
  },
  troubleshootBody: {
    fontSize: appTheme.fontSize.sm,
    color: colors.infoText,
    lineHeight: 18,
  },

  /* Submit */
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    marginTop: 12,
    ...appTheme.shadow.primary,
  },
  submitButtonDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  submitLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
    letterSpacing: 0.2,
  },

  /* Footer */
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
  },
  footerText: {
    fontSize: 13,
    color: colors.mutedText,
  },
  footerBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  footerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.3,
  },
});
