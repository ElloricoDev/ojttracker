import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DrawerParamList, STUDENT_ROUTES, StudentRouteName } from '../navigation/types';
import { appTheme } from '../theme';
import { useResponsive } from '../theme/responsive';
import { useDrawer } from './DrawerContext';
import { useAuthSession } from '../stores/authSession';
import ConfirmDialog from './ConfirmDialog';
import { useToast } from './ToastProvider';
import { useTheme } from '../theme/ThemeProvider';

type NavigationProp = NativeStackNavigationProp<DrawerParamList>;

const PRIMARY_ROUTES: StudentRouteName[] = [
  'Dashboard',
  'Placement',
  'Attendance',
  'DailyReports',
  'WeeklyReports',
  'Documents',
];

const SECONDARY_ROUTES: StudentRouteName[] = ['Notifications', 'Profile'];

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function StudentDrawerContent() {
  const navigation = useNavigation<NavigationProp>();
  const activeRoute = useNavigationState((state) => {
    const rootRoute = state.routes[state.index];
    const nestedState = 'state' in rootRoute ? rootRoute.state : undefined;
    if (
      nestedState &&
      'routes' in nestedState &&
      typeof nestedState.index === 'number' &&
      Array.isArray(nestedState.routes) &&
      nestedState.routes[nestedState.index]
    ) {
      const nestedRoute = nestedState.routes[nestedState.index] as { name: string };
      return nestedRoute.name as StudentRouteName;
    }
    return rootRoute.name as StudentRouteName;
  });
  const { closeDrawer } = useDrawer();
  const { user, logout } = useAuthSession();
  const { s } = useResponsive();
  const { colors } = useTheme();
  const styles = getStyles(s, colors);
  const toast = useToast();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const displayName = user?.name ?? 'Student';
  const roleLabel = user?.role ? user.role : 'Student';
  const initials = getInitials(displayName);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={22}
                color={appTheme.colors.primary}
              />
            </View>
            <View style={styles.brandText}>
              <Text style={styles.title}>OJT Tracker</Text>
              <Text style={styles.subtitle}>Student workspace</Text>
            </View>
          </View>
        </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Navigation</Text>
        {STUDENT_ROUTES.filter((route) => PRIMARY_ROUTES.includes(route.name)).map((route) => {
          const isActive = activeRoute === route.name;

          return (
            <Pressable
              key={route.name}
              onPress={() => {
                if (!isActive) {
                  navigation.navigate(route.name);
                }
                closeDrawer();
              }}
              style={({ pressed }) => [
                styles.item,
                isActive && styles.itemActive,
                pressed && styles.itemPressed,
              ]}
            >
              <View style={[styles.iconBadge, isActive && styles.iconBadgeActive]}>
                <MaterialCommunityIcons
                  name={route.icon}
                  size={18}
                  color={isActive ? colors.primary : colors.text}
                />
              </View>
              <View style={styles.itemText}>
                <Text style={[styles.itemLabel, isActive && styles.itemLabelActive]}>
                  {route.label}
                </Text>
                <Text style={styles.itemMeta}>
                  {route.name === 'Dashboard'
                    ? 'Overview & alerts'
                    : route.name === 'Placement'
                      ? 'Company details'
                      : route.name === 'Attendance'
                        ? 'Daily time logs'
                        : route.name === 'DailyReports'
                          ? 'Daily reflections'
                          : route.name === 'WeeklyReports'
                            ? 'Weekly summaries'
                            : route.name === 'Documents'
                              ? 'Required files'
                              : route.name === 'Notifications'
                                ? 'Reminders'
                                : 'Account settings'}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>
        {STUDENT_ROUTES.filter((route) => SECONDARY_ROUTES.includes(route.name)).map((route) => {
          const isActive = activeRoute === route.name;

          return (
            <Pressable
              key={route.name}
              onPress={() => {
                if (!isActive) {
                  navigation.navigate(route.name);
                }
                closeDrawer();
              }}
              style={({ pressed }) => [
                styles.item,
                isActive && styles.itemActive,
                pressed && styles.itemPressed,
              ]}
            >
              <View style={[styles.iconBadge, isActive && styles.iconBadgeActive]}>
                <MaterialCommunityIcons
                  name={route.icon}
                  size={18}
                  color={isActive ? colors.primary : colors.text}
                />
              </View>
              <View style={styles.itemText}>
                <Text style={[styles.itemLabel, isActive && styles.itemLabelActive]}>
                  {route.label}
                </Text>
                <Text style={styles.itemMeta}>
                  {route.name === 'Notifications' ? 'Alerts & reminders' : 'Account settings'}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerPill}>
          <MaterialCommunityIcons name="shield-check" size={14} color="#1D4ED8" />
          <Text style={styles.footerText}>Secure student access</Text>
        </View>
        <View style={styles.footerUser}>
          <View style={styles.footerAvatar}>
            <Text style={styles.footerInitials}>{initials}</Text>
          </View>
          <View style={styles.footerInfo}>
            <Text style={styles.footerName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.footerMeta} numberOfLines={1}>
              {roleLabel}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => {
            setShowLogoutConfirm(true);
          }}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.itemPressed]}
        >
          <MaterialCommunityIcons name="logout" size={18} color="#B91C1C" />
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </View>

      <ConfirmDialog
        visible={showLogoutConfirm}
        title="Log out"
        message="You will need to sign in again to access your account."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        destructive
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={async () => {
          setShowLogoutConfirm(false);
          try {
            await logout();
            toast.show({ type: 'success', title: 'Logged out', message: 'You have been signed out.' });
            closeDrawer();
          } catch (requestError) {
            toast.show({
              type: 'error',
              title: 'Logout failed',
              message: 'Unable to log out right now.',
            });
          }
        }}
      />
    </View>
  );
}

const getStyles = (s: (value: number) => number, colors: typeof appTheme.colors) =>
  StyleSheet.create({
  container: {
    paddingHorizontal: s(appTheme.spacing.md),
    paddingBottom: s(appTheme.spacing.xs),
    paddingTop: 0,
    backgroundColor: colors.surface,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: s(appTheme.spacing.md),
  },
  header: {
    paddingBottom: s(appTheme.spacing.md),
    gap: s(appTheme.spacing.xs),
    marginTop: s(appTheme.spacing.sm),
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(appTheme.spacing.sm),
  },
  brandText: {
    gap: 2,
  },
  logoBadge: {
    width: s(40),
    height: s(40),
    borderRadius: s(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  title: {
    fontSize: s(18),
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: s(12),
    color: colors.mutedText,
  },
  quickHints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(appTheme.spacing.xs),
    paddingTop: s(appTheme.spacing.xs),
  },
  hintDot: {
    width: s(6),
    height: s(6),
    borderRadius: s(3),
    backgroundColor: '#34D399',
  },
  hintText: {
    fontSize: s(11),
    color: colors.subtleText,
  },
  section: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: s(appTheme.spacing.sm),
    gap: s(appTheme.spacing.xs),
  },
  sectionLabel: {
    fontSize: s(11),
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.subtleText,
    marginBottom: s(appTheme.spacing.xs),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(appTheme.spacing.sm),
    paddingHorizontal: s(appTheme.spacing.md),
    paddingVertical: s(appTheme.spacing.xs),
    borderRadius: s(12),
  },
  itemActive: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryRing,
  },
  itemPressed: {
    opacity: 0.85,
  },
  iconBadge: {
    width: s(30),
    height: s(30),
    borderRadius: s(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  iconBadgeActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryRing,
  },
  itemText: {
    flex: 1,
    gap: 2,
  },
  itemLabel: {
    fontSize: s(14),
    fontWeight: '600',
    color: colors.mutedText,
  },
  itemLabelActive: {
    color: colors.primary,
  },
  itemMeta: {
    fontSize: s(11),
    color: colors.subtleText,
  },
  footer: {
    marginTop: s(appTheme.spacing.md),
    gap: s(appTheme.spacing.xs),
  },
  footerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(appTheme.spacing.xs),
    paddingVertical: 2,
    paddingHorizontal: s(appTheme.spacing.sm),
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryRing,
    alignSelf: 'center',
  },
  footerText: {
    fontSize: s(11),
    fontWeight: '600',
    color: colors.primary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(appTheme.spacing.xs),
    paddingVertical: s(appTheme.spacing.xs),
    paddingHorizontal: s(appTheme.spacing.sm),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    alignSelf: 'center',
    marginBottom: s(appTheme.spacing.xs),
  },
  logoutText: {
    fontSize: s(12),
    fontWeight: '600',
    color: '#B91C1C',
  },
  footerUser: {
    flexDirection: 'row',
    gap: s(appTheme.spacing.sm),
    alignItems: 'center',
    padding: s(appTheme.spacing.xs),
    borderRadius: s(14),
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  footerAvatar: {
    width: s(36),
    height: s(36),
    borderRadius: s(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  footerInitials: {
    fontSize: s(15),
    fontWeight: '700',
    color: colors.primary,
  },
  footerInfo: {
    flex: 1,
    gap: 2,
  },
  footerName: {
    fontSize: s(13),
    fontWeight: '700',
    color: colors.text,
  },
  footerMeta: {
    fontSize: s(11),
    color: colors.mutedText,
  },
});
