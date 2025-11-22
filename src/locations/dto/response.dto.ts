

export interface PaginateResult<T> {
  meta: {
    page: number;
    limit: number;
    pages: number;
    total: number;
  };
  result: T[];
}
