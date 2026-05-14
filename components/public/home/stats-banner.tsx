interface Stat {
  value: string;
  label: string;
}

interface StatsBannerProps {
  stats: Stat[];
}

/**
 * Deep-teal banner with a 4-up stats grid. Mobile collapses to 2 cols.
 * Numbers render in Fraunces light, large, in turquoise-light.
 */
export function StatsBanner({ stats }: StatsBannerProps) {
  return (
    <section className="bg-primary text-ivory">
      <div className="container-x py-12">
        <div className="grid grid-cols-2 gap-8 text-center sm:grid-cols-4 sm:gap-10">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-heading text-[3.5rem] font-light leading-none text-turquoise-light">
                {s.value}
              </div>
              <div className="mt-2 text-[0.82rem] uppercase tracking-[0.15em] text-ivory/80">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
