export function parsePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

export function paginate<T>(items: T[], page: number, perPage: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * perPage;
  const pagedItems = items.slice(start, start + perPage);

  return { items: pagedItems, page: safePage, totalPages, total };
}

export function getPageUrl(baseUrl: string, page: number) {
  return page <= 1 ? baseUrl : `${baseUrl}?page=${page}`;
}
