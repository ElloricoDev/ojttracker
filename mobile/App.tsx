import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import ToastProvider from './src/components/ToastProvider';
import { AuthSessionProvider } from './src/stores/authSession';
import { PlacementSessionProvider } from './src/stores/placementSession';
import ThemeProvider, { useTheme } from './src/theme/ThemeProvider';

// ─────────────────────────────────────────────
//  Navigation theme — maps React Navigation
//  color roles to our design tokens.
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
//  App
// ─────────────────────────────────────────────
function AppRoot() {
  const insets = useSafeAreaInsets();
  const { colors, mode } = useTheme();

  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.borderLight,
      notification: colors.primary,
    },
  };

  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
        paddingTop: 0,
        paddingBottom: 0,
        backgroundColor: colors.background,
      }}
    >
      <AuthSessionProvider>
        <PlacementSessionProvider>
          <ToastProvider>
            <NavigationContainer theme={navigationTheme}>
              <StatusBar
                style={mode === 'dark' ? 'light' : 'dark'}
                backgroundColor={
                  Platform.OS === 'android' ? colors.background : undefined
                }
                translucent={Platform.OS !== 'android'}
              />
              <AppNavigator />
            </NavigationContainer>
          </ToastProvider>
        </PlacementSessionProvider>
      </AuthSessionProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppRoot />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
