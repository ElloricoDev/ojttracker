import { PropsWithChildren } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../theme';
import { useResponsive } from '../theme/responsive';
import { useDrawer } from './DrawerContext';
import ScreenContainer from './ScreenContainer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type StudentScreenLayoutProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  refreshing: boolean;
  onRefresh: () => void;
}>;

export default function StudentScreenLayout({
  title,
  subtitle,
  refreshing,
  onRefresh,
  children,
}: StudentScreenLayoutProps) {
  const { openDrawer } = useDrawer();
  const { s } = useResponsive();
  const insets = useSafeAreaInsets();
  const styles = getStyles(s);

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
            <MaterialCommunityIcons name="menu" size={22} color={appTheme.colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={appTheme.colors.primary}
          />
        }
      >
        {children}
      </ScrollView>
    </ScreenContainer>
  );
}

const getStyles = (s: (value: number) => number) =>
  StyleSheet.create({
  header: {
    gap: s(appTheme.spacing.xs),
    marginTop: s(8),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(appTheme.spacing.sm),
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  menuButton: {
    width: s(40),
    height: s(40),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: appTheme.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appTheme.colors.surface,
  },
  menuButtonPressed: {
    opacity: 0.8,
  },
  title: {
    fontSize: s(26),
    fontWeight: '700',
    color: appTheme.colors.text,
  },
  subtitle: {
    fontSize: s(14),
    color: appTheme.colors.mutedText,
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
});
