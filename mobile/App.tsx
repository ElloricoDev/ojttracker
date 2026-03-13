import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthSessionProvider } from './src/stores/authSession';
import { appTheme } from './src/theme';

// ─────────────────────────────────────────────
//  Navigation theme — maps React Navigation
//  color roles to our design tokens.
// ─────────────────────────────────────────────
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: appTheme.colors.primary,
    background: appTheme.colors.background,
    card: appTheme.colors.surface,
    text: appTheme.colors.text,
    border: appTheme.colors.borderLight,
    notification: appTheme.colors.primary,
  },
};

// ─────────────────────────────────────────────
//  App
// ─────────────────────────────────────────────
function AppRoot() {
  const insets = useSafeAreaInsets();

  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
        paddingTop: 0,
        paddingBottom: 0,
        backgroundColor: appTheme.colors.background,
      }}
    >
      <AuthSessionProvider>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar
            style="dark"
            backgroundColor={
              Platform.OS === 'android' ? appTheme.colors.background : undefined
            }
            translucent={Platform.OS !== 'android'}
          />
          <AppNavigator />
        </NavigationContainer>
      </AuthSessionProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppRoot />
    </SafeAreaProvider>
  );
}
