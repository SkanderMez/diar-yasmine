import { Link } from "@/i18n/navigation";

interface ListingEmptyStateProps {
  title?: string;
  body?: string;
}

/**
 * Visual hint shown when filters drop the result count to zero. Keeps the
 * page visually anchored (dashed card, primary CTA) instead of leaving a
 * blank gap below the toolbar.
 */
export function ListingEmptyState({
  title = "Aucun hébergement ne correspond",
  body = "Essayez d'élargir vos critères, ou explorez l'ensemble de nos hébergements.",
}: ListingEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-card p-12 text-center">
      <h3 className="font-heading text-2xl text-foreground">{title}</h3>
      <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
        {body}
      </p>
      <Link
        href="/chalets"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:shadow-md"
      >
        Voir tous les hébergements
      </Link>
    </div>
  );
}
