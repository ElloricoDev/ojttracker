import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StudentDrawerContent from '../components/StudentDrawerContent';
import { DrawerProvider } from '../components/DrawerContext';
import ScreenContainer from '../components/ScreenContainer';
import AttendanceScreen from '../screens/AttendanceScreen';
import DailyReportsScreen from '../screens/DailyReportsScreen';
import DashboardScreen from '../screens/DashboardScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import LoginScreen from '../screens/LoginScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PlacementScreen from '../screens/PlacementScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WeeklyReportsScreen from '../screens/WeeklyReportsScreen';
import { useAuthSession } from '../stores/authSession';
import { appTheme } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DrawerParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const StudentStack = createNativeStackNavigator<DrawerParamList>();

function DashboardScreenWrapper() {
  const { user } = useAuthSession();
  return <DashboardScreen user={user} />;
}

function ProfileScreenWrapper() {
  const { user, logout } = useAuthSession();
  return <ProfileScreen user={user} onLogout={logout} />;
}

function LoginScreenWrapper() {
  const { login, isLoginLoading, loginError, bootstrapError } = useAuthSession();
  return (
    <LoginScreen
      onLogin={login}
      isLoading={isLoginLoading}
      errorMessage={loginError}
      bootstrapError={bootstrapError}
    />
  );
}

function StudentDrawerNavigator() {
  const [isOpen, setIsOpen] = useState(false);
  const progress = useMemo(() => new Animated.Value(0), []);
  const drawerWidth = 280;
  const lastProgress = useRef(0);
  const insets = useSafeAreaInsets();
  const edgeGap = insets.top;
  const bottomGap = insets.bottom;

  const openDrawer = () => {
    setIsOpen(true);
    Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsOpen(false);
      }
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (evt, gesture) => {
          const isEdgeSwipe = evt.nativeEvent.pageX <= 24;
          const isHorizontal = Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 8;
          return isHorizontal && (isEdgeSwipe || isOpen);
        },
        onPanResponderGrant: () => {
          progress.stopAnimation((value) => {
            lastProgress.current = value;
          });
        },
        onPanResponderMove: (_evt, gesture) => {
          const raw = lastProgress.current + gesture.dx / drawerWidth;
          const clamped = Math.max(0, Math.min(1, raw));
          progress.setValue(clamped);
        },
        onPanResponderRelease: (_evt, gesture) => {
          const shouldOpen = gesture.vx > 0.2 || lastProgress.current + gesture.dx / drawerWidth > 0.4;
          if (shouldOpen) {
            openDrawer();
          } else {
            closeDrawer();
          }
        },
        onPanResponderTerminate: () => {
          closeDrawer();
        },
      }),
    [drawerWidth, isOpen, progress]
  );

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-drawerWidth, 0],
  });

  const overlayOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.35],
  });

  return (
    <DrawerProvider value={{ openDrawer, closeDrawer }}>
      <View style={styles.drawerRoot} {...panResponder.panHandlers}>
        <StudentStack.Navigator screenOptions={{ headerShown: false }}>
          <StudentStack.Screen name="Dashboard" component={DashboardScreenWrapper} />
          <StudentStack.Screen name="Placement" component={PlacementScreen} />
          <StudentStack.Screen name="Attendance" component={AttendanceScreen} />
          <StudentStack.Screen name="DailyReports" component={DailyReportsScreen} />
          <StudentStack.Screen name="WeeklyReports" component={WeeklyReportsScreen} />
          <StudentStack.Screen name="Documents" component={DocumentsScreen} />
          <StudentStack.Screen name="Notifications" component={NotificationsScreen} />
          <StudentStack.Screen name="Profile" component={ProfileScreenWrapper} />
        </StudentStack.Navigator>

        {isOpen ? (
          <Pressable style={styles.drawerOverlay} onPress={closeDrawer}>
            <Animated.View style={[styles.drawerOverlayTint, { opacity: overlayOpacity }]} />
          </Pressable>
        ) : null}

        <Animated.View
          style={[
            styles.drawerPanel,
            { width: drawerWidth, transform: [{ translateX }], top: edgeGap, bottom: bottomGap },
          ]}
          pointerEvents={isOpen ? 'auto' : 'none'}
        >
          <StudentDrawerContent />
        </Animated.View>
      </View>
    </DrawerProvider>
  );
}

export default function AppNavigator() {
  const { status } = useAuthSession();

  if (status === 'bootstrapping') {
    return (
      <ScreenContainer>
        <ActivityIndicator size="large" color={appTheme.colors.primary} />
        <Text style={styles.title}>Restoring session...</Text>
        <Text style={styles.subtitle}>Checking your saved login state.</Text>
      </ScreenContainer>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {status === 'authenticated' ? (
        <Stack.Screen name="App" component={StudentDrawerNavigator} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreenWrapper} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: appTheme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: appTheme.colors.mutedText,
  },
  drawerRoot: {
    flex: 1,
  },
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  drawerOverlayTint: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  drawerPanel: {
    position: 'absolute',
    left: 0,
    backgroundColor: appTheme.colors.surface,
    borderRightWidth: 1,
    borderRightColor: appTheme.colors.borderLight,
    shadowColor: '#0F172A',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 6, height: 0 },
    elevation: 6,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    overflow: 'hidden',
  },
});
