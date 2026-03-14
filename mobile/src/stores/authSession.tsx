import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  login as loginRequest,
  logout as logoutRequest,
  me,
  type AuthSession,
  type AuthUser,
} from '../api/auth';
import { authStore } from './authStore';
import { API_BASE_URL } from '../utils/env';

const ACCESS_TOKEN_STORAGE_KEY = 'ojttracker:mobile:access-token';

type AuthStatus = 'bootstrapping' | 'authenticated' | 'unauthenticated';

type AuthSessionContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  isLoginLoading: boolean;
  loginError: string | null;
  bootstrapError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | undefined>(undefined);

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return `Unable to reach server at ${API_BASE_URL}. Check Wi-Fi and make sure Laravel is running on port 8000.`;
    }

    const responseData = error.response?.data as { message?: string } | undefined;
    if (typeof responseData?.message === 'string' && responseData.message.length > 0) {
      return responseData.message;
    }
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return fallbackMessage;
}

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('bootstrapping');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const clearStoredSession = useCallback(async () => {
    authStore.clearAccessToken();
    await AsyncStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    setUser(null);
    setStatus('unauthenticated');
    setIsLoginLoading(false);
  }, []);

  const bootstrapSession = useCallback(async () => {
    setStatus('bootstrapping');
    setBootstrapError(null);
    setLoginError(null);

    try {
      const storedToken = await AsyncStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

      if (!storedToken) {
        authStore.clearAccessToken();
        setUser(null);
        setStatus('unauthenticated');
        return;
      }

      authStore.setAccessToken(storedToken);

      const currentUser = await me();
      setUser(currentUser);
      setStatus('authenticated');
    } catch (error) {
      await clearStoredSession();

      if (!axios.isAxiosError(error) || error.response?.status !== 401) {
        setBootstrapError(
          getErrorMessage(error, 'Unable to restore your session. Please sign in again.')
        );
      }
    }
  }, [clearStoredSession]);

  useEffect(() => {
    void bootstrapSession();
  }, [bootstrapSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoginLoading(true);
      setLoginError(null);
      setBootstrapError(null);

      try {
        const session: AuthSession = await loginRequest(email.trim(), password);

        authStore.setAccessToken(session.token);
        await AsyncStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, session.token);

        setUser(session.user);
        setStatus('authenticated');
      } catch (error) {
        await clearStoredSession();
        setLoginError(getErrorMessage(error, 'Unable to sign in.'));
      } finally {
        setIsLoginLoading(false);
      }
    },
    [clearStoredSession]
  );

  const logout = useCallback(async () => {
    let logoutError: unknown = null;

    try {
      await logoutRequest();
    } catch (error) {
      logoutError = error;
    }

    await clearStoredSession();
    setLoginError(null);

    if (logoutError && (!axios.isAxiosError(logoutError) || logoutError.response?.status !== 401)) {
      setBootstrapError(
        getErrorMessage(logoutError, 'Signed out locally, but we could not reach the server.')
      );
      return;
    }

    setBootstrapError(null);
  }, [clearStoredSession]);

  const handleUnauthorized = useCallback(() => {
    void clearStoredSession();
  }, [clearStoredSession]);

  useEffect(() => {
    authStore.setUnauthorizedHandler(handleUnauthorized);

    return () => {
      authStore.setUnauthorizedHandler(null);
    };
  }, [handleUnauthorized]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      status,
      user,
      isLoginLoading,
      loginError,
      bootstrapError,
      login,
      logout,
    }),
    [status, user, isLoginLoading, loginError, bootstrapError, login, logout]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error('useAuthSession must be used within an AuthSessionProvider.');
  }

  return context;
}
