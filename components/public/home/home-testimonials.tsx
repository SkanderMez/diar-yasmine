import { Star } from "lucide-react";

interface Testimonial {
  name: string;
  location: string;
  period: string;
  quote: string;
  initials: string;
}

interface HomeTestimonialsProps {
  items: Testimonial[];
}

/**
 * Sand-background testimonial trio with a giant decorative " mark
 * absolutely positioned behind the grid. White cards with 5 gold stars,
 * serif quote, and an initialed avatar.
 */
export function HomeTestimonials({ items }: HomeTestimonialsProps) {
  return (
    <section className="section-y relative overflow-hidden bg-sand">
      {/* Giant decorative " mark behind the grid. Raw hex on the colour is
       *  intentional — turquoise at 0.08 alpha, the exact maquette value. */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-[-40px] top-[50px] font-heading leading-[0.8]"
        style={{
          fontSize: "30rem",
          color: "rgba(79,184,196,0.08)",
        }}
      >
        &ldquo;
      </span>

      <div className="container-x relative z-[1]">
        <div className="mb-12 text-center">
          <p className="eyebrow">Témoignages</p>
          <h2 className="heading-display mt-3 text-4xl text-foreground sm:text-5xl">
            Ils en parlent <span className="heading-em">mieux que nous</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((t) => (
            <article
              key={t.name}
              className="rounded-[16px] bg-white p-6 shadow-sm"
            >
              <div className="mb-3 flex gap-0.5 text-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-gold stroke-gold" />
                ))}
              </div>
              <p className="mb-4 font-heading text-[1.15rem] font-normal leading-[1.5] text-foreground">
                <span aria-hidden>&ldquo;</span>
                {t.quote}
                <span aria-hidden>&rdquo;</span>
              </p>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-turquoise font-heading font-semibold text-primary">
                  {t.initials}
                </div>
                <div>
                  <div className="text-[0.95rem] font-semibold text-foreground">
                    {t.name}
                  </div>
                  <div className="text-[0.82rem] text-muted-foreground">
                    {t.location} · {t.period}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
