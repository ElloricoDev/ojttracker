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
import { appTheme } from '../theme';
import { API_BASE_URL } from '../utils/env';

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

  return (
    <ScreenContainer scroll={false} keyboardAvoiding={false} withPadding={false}>
      <Animated.View style={[styles.content, { transform: [{ translateY: keyboardShift }] }]}>

          {/* ── Hero ── */}
          <View style={styles.hero}>
            <View style={styles.brandWrap}>
              <View style={styles.brandBg}>
                <MaterialCommunityIcons
                  name="shield-check-outline"
                  size={32}
                  color={appTheme.colors.primary}
                />
              </View>
              <View style={styles.brandDot} />
            </View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to your OJT student account{'\n'}to continue
            </Text>
          </View>

          {/* ── Form ── */}
          <View style={styles.formPlain}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Sign in</Text>
              <Text style={styles.formSubtitle}>Use the credentials provided by your coordinator.</Text>
            </View>

            <View style={styles.form}>
              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email address</Text>
                <View style={styles.inputRow}>
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={17}
                    color={appTheme.colors.mutedText}
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
                    placeholderTextColor={appTheme.colors.subtleText}
                    selectionColor={appTheme.colors.primary}
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
                        color={appTheme.colors.mutedText}
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
                    color={appTheme.colors.mutedText}
                  />
                  <TextInput
                    ref={passwordRef}
                    editable={!isLoading}
                    onChangeText={handlePasswordChange}
                    onSubmitEditing={() => {
                      void handleLogin();
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor={appTheme.colors.subtleText}
                    secureTextEntry={!showPassword}
                    blurOnSubmit={false}
                    selectionColor={appTheme.colors.primary}
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
                      color={appTheme.colors.mutedText}
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
                    color={appTheme.colors.warningText}
                  />
                  <Text style={styles.warningText}>{bootstrapError}</Text>
                </View>
              ) : null}
              {visibleError ? (
                <View style={styles.errorBox}>
                  <MaterialCommunityIcons
                    name="alert-outline"
                    size={15}
                    color={appTheme.colors.errorText}
                  />
                  <Text style={styles.errorText}>{visibleError}</Text>
                </View>
              ) : null}
              {showTroubleshooting ? (
                <View style={styles.troubleshootBox}>
                  <MaterialCommunityIcons
                    name="wifi-alert"
                    size={16}
                    color={appTheme.colors.infoText}
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
                  <ActivityIndicator size="small" color={appTheme.colors.surface} />
                ) : (
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={18}
                    color={appTheme.colors.surface}
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
            <Text style={styles.footerText}>OJT Tracking System</Text>
            <View style={styles.footerBadge}>
              <Text style={styles.footerBadgeText}>v1.0</Text>
            </View>
          </View>

      </Animated.View>
    </ScreenContainer>
  );
}

const PRIMARY = appTheme.colors.primary;
const PRIMARY_LIGHT = appTheme.colors.primaryLight;

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: appTheme.colors.background },

  content: {
    paddingHorizontal: appTheme.layout.screenPadding,
    paddingBottom: appTheme.spacing.xl,
  },

  /* Hero */
  hero: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
  },
  brandWrap: {
    position: 'relative',
    marginBottom: 20,
  },
  brandBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.borderLight,
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
    backgroundColor: PRIMARY,
    borderWidth: 3,
    borderColor: appTheme.colors.background,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: appTheme.colors.text,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: appTheme.colors.mutedText,
    textAlign: 'center',
    lineHeight: 21,
  },

  /* Form */
  formPlain: {
    paddingVertical: appTheme.spacing.md,
  },
  formHeader: {
    gap: appTheme.spacing.xs,
    marginBottom: appTheme.spacing.md - 2,
  },
  formTitle: {
    fontSize: appTheme.fontSize.xl,
    fontWeight: appTheme.fontWeight.bold,
    color: appTheme.colors.text,
  },
  formSubtitle: {
    fontSize: appTheme.fontSize.base,
    color: appTheme.colors.mutedText,
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
    color: appTheme.colors.mutedText,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  passwordHint: {
    fontSize: 12,
    fontWeight: '500',
    color: appTheme.colors.subtleText,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: appTheme.input.height,
    paddingHorizontal: appTheme.input.paddingH,
    backgroundColor: appTheme.colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: appTheme.colors.borderLight,
    borderRadius: appTheme.input.borderRadius,
  },
  input: {
    flex: 1,
    fontSize: appTheme.input.fontSize,
    color: appTheme.colors.text,
    paddingVertical: 0,
  },

  /* Alerts */
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: appTheme.colors.warningLight,
    borderRadius: 12,
    padding: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: appTheme.colors.warningText,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: appTheme.colors.errorLight,
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: appTheme.colors.errorText,
    lineHeight: 18,
  },
  troubleshootBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appTheme.spacing.sm,
    backgroundColor: appTheme.colors.infoLight,
    borderRadius: appTheme.radius.md,
    padding: appTheme.spacing.sm + 2,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  troubleshootTextWrap: {
    flex: 1,
    gap: appTheme.spacing.xs,
  },
  troubleshootTitle: {
    fontSize: appTheme.fontSize.base,
    fontWeight: appTheme.fontWeight.semibold,
    color: appTheme.colors.infoText,
  },
  troubleshootBody: {
    fontSize: appTheme.fontSize.sm,
    color: appTheme.colors.infoText,
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
    backgroundColor: PRIMARY,
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
    color: '#fff',
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
    color: appTheme.colors.mutedText,
  },
  footerBadge: {
    backgroundColor: PRIMARY_LIGHT,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  footerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: PRIMARY,
    letterSpacing: 0.3,
  },
});
