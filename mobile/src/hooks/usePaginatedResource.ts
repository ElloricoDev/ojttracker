import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ListDirection, PaginatedQuery, PaginatedResponse, PaginationMeta } from '../types/api';
import { getApiErrorMessage } from '../utils/errors';

type LoadMode = 'initial' | 'refresh' | 'append';

type PaginatedFetcher<TItem> = (query: PaginatedQuery) => Promise<PaginatedResponse<TItem>>;

type UsePaginatedResourceOptions = {
  perPage?: number;
  search?: string;
  sort?: string;
  direction?: ListDirection;
  placementId?: number;
  enabled?: boolean;
};

export function usePaginatedResource<TItem>(
  fetcher: PaginatedFetcher<TItem>,
  options: UsePaginatedResourceOptions = {}
) {
  const [items, setItems] = useState<TItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(options.enabled ?? true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isMounted = useRef(true);

  const enabled = options.enabled ?? true;

  const query = useMemo<PaginatedQuery>(
    () => ({
      perPage: options.perPage ?? 10,
      search: options.search,
      sort: options.sort,
      direction: options.direction,
      placementId: options.placementId,
    }),
    [options.perPage, options.search, options.sort, options.direction, options.placementId]
  );

  const loadPage = useCallback(
    async (page: number, mode: LoadMode) => {
      if (!enabled) {
        return;
      }

      if (isMounted.current) {
        if (mode === 'initial') {
          setIsLoading(true);
        } else if (mode === 'refresh') {
          setIsRefreshing(true);
        } else {
          setIsLoadingMore(true);
        }

        if (mode !== 'append') {
          setError(null);
        }
      }

      try {
        const response = await fetcher({
          ...query,
          page,
        });

        if (isMounted.current) {
          setMeta(response.meta);
          setItems((currentItems) =>
            mode === 'append' ? [...currentItems, ...response.data] : response.data
          );
          setError(null);
        }
      } catch (requestError) {
        if (isMounted.current) {
          setError(getApiErrorMessage(requestError, 'Unable to load data right now.'));
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
          setIsRefreshing(false);
          setIsLoadingMore(false);
        }
      }
    },
    [enabled, fetcher, query]
  );

  useEffect(() => {
    isMounted.current = true;
    if (!enabled) {
      setItems([]);
      setMeta(null);
      setError(null);
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
      return;
    }

    void loadPage(1, 'initial');

    return () => {
      isMounted.current = false;
    };
  }, [enabled, loadPage]);

  const refresh = useCallback(() => {
    void loadPage(1, 'refresh');
  }, [loadPage]);

  const reload = useCallback(() => {
    void loadPage(1, 'initial');
  }, [loadPage]);

  const hasMore = useMemo(() => {
    if (!meta) {
      return false;
    }

    return meta.current_page < meta.last_page;
  }, [meta]);

  const loadMore = useCallback(() => {
    if (!enabled || !meta || !hasMore || isLoading || isRefreshing || isLoadingMore) {
      return;
    }

    void loadPage(meta.current_page + 1, 'append');
  }, [enabled, hasMore, isLoading, isLoadingMore, isRefreshing, loadPage, meta]);

  return {
    items,
    meta,
    error,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    refresh,
    reload,
    loadMore,
  };
}
