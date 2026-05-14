import { Star } from "lucide-react";

interface ReviewCriterion {
  label: string;
  value: number;
}

interface ReviewItem {
  author: string;
  initials: string;
  date: string;
  rating: number;
  body: string;
  avatarTone?: "primary" | "bougainvillier" | "olive";
}

interface PropertyReviewsSummaryProps {
  overallRating: number;
  totalReviews: number;
  criteria: ReviewCriterion[];
  reviews: ReviewItem[];
}

const TONES: Record<NonNullable<ReviewItem["avatarTone"]>, string> = {
  primary: "bg-turquoise-light/40 text-primary",
  bougainvillier: "bg-bougainvillier-light/40 text-bougainvillier",
  olive: "bg-olive-light/40 text-[#4d5e3f]",
};

/**
 * Maquette `.reviews-summary` + `.review-grid`. Left summary card (big
 * Fraunces rating + count), right column = 6 progress bars showing the
 * per-criterion rating. Below, a 2x2 grid of review cards.
 */
export function PropertyReviewsSummary({
  overallRating,
  totalReviews,
  criteria,
  reviews,
}: PropertyReviewsSummaryProps) {
  return (
    <div>
      <div className="grid items-center gap-8 pb-8 md:grid-cols-[1fr_2fr]">
        {/* Big rating card */}
        <div className="rounded-2xl bg-sand p-6 text-center">
          <div className="font-heading text-[4rem] font-light leading-none text-primary sm:text-[4.5rem]">
            {overallRating.toFixed(2)}
          </div>
          <div className="my-2 flex justify-center gap-0.5 text-gold">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="size-3.5"
                fill="currentColor"
                strokeWidth={0}
              />
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            {totalReviews} voyageurs vérifiés
          </div>
        </div>

        {/* Criterion bars */}
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {criteria.map((c) => {
            const pct = Math.max(0, Math.min(100, (c.value / 5) * 100));
            return (
              <div key={c.label} className="flex items-center gap-3 text-sm">
                <span className="w-[110px] shrink-0 text-charcoal">
                  {c.label}
                </span>
                <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-line-soft">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="w-8 text-right font-mono text-xs font-medium tabular-nums text-charcoal">
                  {c.value.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review cards grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {reviews.map((r, i) => {
          const tone = r.avatarTone ?? "primary";
          return (
            <article
              key={`${r.author}-${i}`}
              className="rounded-2xl border border-line-soft p-5 transition-colors hover:border-line"
            >
              <header className="mb-3 flex items-center gap-3">
                <span
                  className={`inline-flex size-11 items-center justify-center rounded-full font-heading font-semibold ${TONES[tone]}`}
                >
                  {r.initials}
                </span>
                <div>
                  <div className="text-[0.95rem] font-semibold text-charcoal">
                    {r.author}
                  </div>
                  <div className="text-xs text-muted-foreground">{r.date}</div>
                </div>
              </header>
              <div className="mb-2 flex gap-0.5 text-gold">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className="size-3"
                    fill="currentColor"
                    strokeWidth={0}
                    style={{ opacity: j < Math.round(r.rating) ? 1 : 0.35 }}
                  />
                ))}
              </div>
              <p className="text-[0.92rem] leading-relaxed text-charcoal-soft">
                {r.body}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
