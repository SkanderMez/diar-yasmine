import { Link } from "@/i18n/navigation";

interface ReservationsPaginationProps {
  page: number;
  perPage: number;
  total: number;
  /** Current `?key=value` parameters to preserve when changing pages. */
  baseParams: Record<string, string | undefined>;
}

/**
 * Builds the numbered button list with ellipses. Always shows first,
 * last, and a window around the current page.
 */
function buildPageList(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const set = new Set<number>([
    1,
    2,
    totalPages - 1,
    totalPages,
    page - 1,
    page,
    page + 1,
  ]);
  const sorted = [...set]
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);

  const out: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i] as number;
    const previous = sorted[i - 1] as number | undefined;
    if (previous !== undefined && current - previous > 1) out.push("…");
    out.push(current);
  }
  return out;
}

function buildHref(
  baseParams: Record<string, string | undefined>,
  page: number,
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(baseParams)) {
    if (v) params.set(k, v);
  }
  if (page > 1) params.set("page", String(page));
  const q = params.toString();
  return q ? `?${q}` : "?";
}

export function ReservationsPagination({
  page,
  perPage,
  total,
  baseParams,
}: ReservationsPaginationProps) {
  if (total === 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const firstIndex = (safePage - 1) * perPage + 1;
  const lastIndex = Math.min(safePage * perPage, total);
  const pages = buildPageList(safePage, totalPages);

  return (
    <div className="pagination">
      <span>
        Page {safePage} sur {totalPages} · {lastIndex - firstIndex + 1} sur{" "}
        {total}
      </span>
      <div className="pagination-controls">
        {safePage > 1 ? (
          <Link
            href={buildHref(baseParams, safePage - 1)}
            aria-label="Page précédente"
          >
            <span>‹</span>
          </Link>
        ) : (
          <button type="button" disabled aria-label="Page précédente">
            ‹
          </button>
        )}
        {pages.map((p, i) =>
          p === "…" ? (
            <button key={`ellipsis-${i}`} type="button" disabled aria-hidden>
              …
            </button>
          ) : p === safePage ? (
            <button
              key={p}
              type="button"
              className="active"
              aria-current="page"
            >
              {p}
            </button>
          ) : (
            <Link key={p} href={buildHref(baseParams, p)}>
              <span>{p}</span>
            </Link>
          ),
        )}
        {safePage < totalPages ? (
          <Link
            href={buildHref(baseParams, safePage + 1)}
            aria-label="Page suivante"
          >
            <span>›</span>
          </Link>
        ) : (
          <button type="button" disabled aria-label="Page suivante">
            ›
          </button>
        )}
      </div>
    </div>
  );
}
