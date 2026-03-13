export type ApiEnvelope<TData> = {
  data: TData;
  message?: string;
};

export type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

export type PaginationLinks = {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
};

export type PaginatedResponse<TItem> = {
  data: TItem[];
  meta: PaginationMeta;
  links: PaginationLinks;
};

export type ListDirection = 'asc' | 'desc';

export type PaginatedQuery = {
  page?: number;
  perPage?: number;
  search?: string;
  sort?: string;
  direction?: ListDirection;
  placementId?: number;
};
