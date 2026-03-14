import { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { appTheme } from '../theme';
import { useResponsive } from '../theme/responsive';
import { useDrawer } from './DrawerContext';
import ScreenContainer from './ScreenContainer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DrawerParamList, StudentRouteIconName } from '../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { submitStudentAttendanceTimeIn, submitStudentAttendanceTimeOut } from '../api/student';
import { useToast } from './ToastProvider';
import { useTheme } from '../theme/ThemeProvider';
import { usePlacementSession } from '../stores/placementSession';

type StudentScreenLayoutProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  headerIconName?: StudentRouteIconName;
  refreshing: boolean;
  onRefresh: () => void;
  withBottomInset?: boolean;
  showQuickActions?: boolean;
  showPlacementBanner?: boolean;
}>;

export default function StudentScreenLayout({
  title,
  subtitle,
  headerIconName,
  refreshing,
  onRefresh,
  withBottomInset = true,
  showQuickActions = true,
  showPlacementBanner = true,
  children,
}: StudentScreenLayoutProps) {
  const { openDrawer } = useDrawer();
  const { s } = useResponsive();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<DrawerParamList>>();
  const { colors, mode, toggle } = useTheme();
  const {
    placement,
    isLoading: isPlacementLoading,
    refresh: refreshPlacement,
  } = usePlacementSession();
  const toast = useToast();
  const [activeQuickAction, setActiveQuickAction] = useState<'time_in' | 'time_out' | null>(null);
  const [isQuickOpen, setIsQuickOpen] = useState(false);
  const quickAnim = useState(() => new Animated.Value(0))[0];
  const spinAnim = useState(() => new Animated.Value(0))[0];
  const styles = getStyles(s, colors);

  const placementId = placement?.id ?? null;
  const placementActive = placement?.status === 'active';
  const placementStatusLabel = placement
    ? placementActive
      ? 'Active placement'
      : 'Placement not active'
    : 'No placement assigned';
  const placementStatusMessage = placement
    ? placement.company?.name ?? 'Company not assigned'
    : 'Request a placement to enable attendance and reports.';

  useFocusEffect(
    useCallback(() => {
      void refreshPlacement();
    }, [refreshPlacement])
  );

  const handleQuickTime = useCallback(
    async (action: 'time_in' | 'time_out') => {
      if (!placementId || !placementActive) {
        toast.show({
          type: 'error',
          title: 'No placement',
          message: 'Attendance requires an active placement.',
        });
        return;
      }

      setActiveQuickAction(action);
      try {
        if (action === 'time_in') {
          await submitStudentAttendanceTimeIn({ placement_id: placementId });
          toast.show({ type: 'success', title: 'Time in', message: 'Attendance recorded.' });
        } else {
          await submitStudentAttendanceTimeOut({ placement_id: placementId });
          toast.show({ type: 'success', title: 'Time out', message: 'Attendance recorded.' });
        }
      } catch (error) {
        toast.show({
          type: 'error',
          title: 'Action failed',
          message: 'Unable to submit attendance action right now.',
        });
      } finally {
        setActiveQuickAction(null);
      }
    },
    [placementId, toast]
  );

  useEffect(() => {
    Animated.timing(quickAnim, {
      toValue: isQuickOpen ? 1 : 0,
      duration: 260,
      useNativeDriver: true,
    }).start();

    Animated.timing(spinAnim, {
      toValue: isQuickOpen ? 1 : 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [isQuickOpen, quickAnim, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <ScreenContainer edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable
            onPress={openDrawer}
            style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Open navigation menu"
          >
            <MaterialCommunityIcons name="menu" size={20} color={colors.text} />
          </Pressable>
          {headerIconName ? (
            <View style={styles.headerIconBadge}>
              <MaterialCommunityIcons name={headerIconName} size={18} color={colors.primary} />
            </View>
          ) : null}
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          <Pressable
            onPress={toggle}
            style={({ pressed }) => [styles.themeButton, pressed && styles.menuButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Toggle theme"
          >
            <MaterialCommunityIcons
              name={mode === 'dark' ? 'weather-sunny' : 'moon-waning-crescent'}
              size={18}
              color={colors.text}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: withBottomInset ? insets.bottom : 0 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {showPlacementBanner ? (
          <View
            style={[
              styles.placementBanner,
              placementActive ? styles.placementBannerActive : styles.placementBannerInactive,
            ]}
          >
            <View style={styles.placementIcon}>
              <MaterialCommunityIcons
                name={placementActive ? 'check-circle-outline' : 'alert-circle-outline'}
                size={16}
                color={placementActive ? colors.success : colors.warningText}
              />
            </View>
            <View style={styles.placementTextWrap}>
              <Text style={styles.placementTitle}>{placementStatusLabel}</Text>
              <Text style={styles.placementSubtitle}>{placementStatusMessage}</Text>
            </View>
          </View>
        ) : null}
        {children}
      </ScrollView>

      {showQuickActions ? (
        <View pointerEvents="box-none" style={styles.quickActionsHost}>
          <Animated.View
            pointerEvents={isQuickOpen ? 'auto' : 'none'}
            style={[
              styles.quickActionsStack,
              {
                opacity: quickAnim,
                transform: [
                  {
                    translateY: quickAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, 0],
                    }),
                  },
                  {
                    scale: quickAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.96, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Pressable
              onPress={() => {
                void handleQuickTime('time_in');
              }}
                disabled={isPlacementLoading || activeQuickAction !== null}
                style={({ pressed }) => [
                  styles.quickAction,
                  styles.quickActionPrimary,
                  pressed && styles.quickActionPressed,
                  (isPlacementLoading || activeQuickAction !== null) && styles.quickActionDisabled,
                ]}
            >
              <View style={styles.quickActionIcon}>
                <MaterialCommunityIcons name="login" size={16} color={colors.text} />
              </View>
              <Text style={styles.quickActionText} numberOfLines={1}>
                Time In
              </Text>
            </Pressable>
              <Pressable
                onPress={() => {
                  void handleQuickTime('time_out');
                }}
                disabled={isPlacementLoading || activeQuickAction !== null}
                style={({ pressed }) => [
                  styles.quickAction,
                  styles.quickActionSecondary,
                  pressed && styles.quickActionPressed,
                  (isPlacementLoading || activeQuickAction !== null) && styles.quickActionDisabled,
                ]}
              >
                <View style={[styles.quickActionIcon, styles.quickActionIconDark]}>
                  <MaterialCommunityIcons name="logout" size={16} color="#FFFFFF" />
                </View>
              <Text style={[styles.quickActionText, styles.quickActionTextLight]} numberOfLines={1}>
                Time Out
              </Text>
            </Pressable>
          </Animated.View>

          <Pressable
            onPress={() => setIsQuickOpen((current) => !current)}
            style={({ pressed }) => [
              styles.fab,
              pressed && styles.fabPressed,
              isQuickOpen && styles.fabOpen,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Quick actions"
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <MaterialCommunityIcons
                name={isQuickOpen ? 'close' : 'plus'}
                size={20}
                color="#FFFFFF"
              />
            </Animated.View>
          </Pressable>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const getStyles = (s: (value: number) => number, colors: typeof appTheme.colors) =>
  StyleSheet.create({
  header: {
    marginTop: s(6),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(appTheme.spacing.xs),
    paddingVertical: s(appTheme.spacing.xs),
    paddingHorizontal: s(appTheme.spacing.xs),
    borderRadius: s(14),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  menuButton: {
    width: s(36),
    height: s(36),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  menuButtonPressed: {
    opacity: 0.8,
  },
  headerIconBadge: {
    width: s(36),
    height: s(36),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: colors.primaryRing,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  title: {
    fontSize: s(24),
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: s(12),
    color: colors.mutedText,
  },
  themeButton: {
    width: s(36),
    height: s(36),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: s(appTheme.spacing.md),
    paddingBottom: 0,
    paddingTop: 0,
    paddingHorizontal: 8,
    marginBottom: 0,
  },
  placementBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(appTheme.spacing.sm),
    paddingVertical: s(appTheme.spacing.sm),
    paddingHorizontal: s(appTheme.spacing.md),
    borderRadius: s(14),
    borderWidth: 1,
  },
  placementBannerActive: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  placementBannerInactive: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  placementIcon: {
    width: s(32),
    height: s(32),
    borderRadius: s(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  placementTextWrap: {
    flex: 1,
    gap: 2,
  },
  placementTitle: {
    fontSize: s(13),
    fontWeight: '700',
    color: colors.text,
  },
  placementSubtitle: {
    fontSize: s(12),
    color: colors.mutedText,
  },
  quickActionsHost: {
    position: 'absolute',
    right: 12,
    bottom: 55,
    alignItems: 'flex-end',
  },
  quickActionsStack: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: s(8),
    marginBottom: s(8),
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    paddingVertical: s(6),
    paddingHorizontal: s(10),
    borderRadius: s(12),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    justifyContent: 'center',
  },
  quickActionPrimary: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },
  quickActionSecondary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickActionDisabled: {
    opacity: 0.6,
  },
  quickActionPressed: {
    opacity: 0.9,
  },
  quickActionIcon: {
    width: s(24),
    height: s(24),
    borderRadius: s(8),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryRing,
  },
  quickActionIconDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  quickActionText: {
    fontSize: s(11),
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  quickActionTextLight: {
    color: '#FFFFFF',
  },
  fab: {
    width: s(52),
    height: s(52),
    borderRadius: s(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#0F172A',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  fabOpen: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryRing,
  },
  fabPressed: {
    opacity: 0.9,
  },
});
