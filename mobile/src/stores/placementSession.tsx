import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Placement } from '../types/student';
import { getStudentPlacement } from '../api/student';
import { getApiErrorMessage } from '../utils/errors';
import { useAuthSession } from './authSession';

type PlacementSessionContextValue = {
  placement: Placement | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<Placement | null>;
  clear: () => void;
};

const PlacementSessionContext = createContext<PlacementSessionContextValue | undefined>(undefined);

export function PlacementSessionProvider({ children }: PropsWithChildren) {
  const { status } = useAuthSession();
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const clear = useCallback(() => {
    setPlacement(null);
    setError(null);
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  const loadPlacement = useCallback(async (mode: 'initial' | 'refresh') => {
    if (status !== 'authenticated') {
      clear();
      return null;
    }

    if (mode === 'initial') {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setError(null);

    try {
      const placementData = await getStudentPlacement();
      if (isMounted.current) {
        setPlacement(placementData);
      }
      return placementData;
    } catch (requestError) {
      if (isMounted.current) {
        setError(getApiErrorMessage(requestError, 'Unable to load placement details.'));
      }
      return null;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [clear, status]);

  const refresh = useCallback(async () => {
    return loadPlacement('refresh');
  }, [loadPlacement]);

  useEffect(() => {
    isMounted.current = true;
    if (status === 'authenticated') {
      void loadPlacement('initial');
    } else {
      clear();
    }

    return () => {
      isMounted.current = false;
    };
  }, [clear, loadPlacement, status]);

  const value = useMemo<PlacementSessionContextValue>(
    () => ({
      placement,
      isLoading,
      isRefreshing,
      error,
      refresh,
      clear,
    }),
    [placement, isLoading, isRefreshing, error, refresh, clear]
  );

  return (
    <PlacementSessionContext.Provider value={value}>
      {children}
    </PlacementSessionContext.Provider>
  );
}

export function usePlacementSession() {
  const context = useContext(PlacementSessionContext);
  if (!context) {
    throw new Error('usePlacementSession must be used within a PlacementSessionProvider.');
  }
  return context;
}
