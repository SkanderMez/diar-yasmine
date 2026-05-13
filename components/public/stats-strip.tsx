import { Compass, Home, Sun, Waves } from "lucide-react";
import { FadeIn } from "./fade-in";

const STATS = [
  { value: "21", label: "hébergements", icon: <Home className="size-5" /> },
  {
    value: "9",
    label: "chalets pieds dans l'eau",
    icon: <Waves className="size-5" />,
  },
  { value: "12", label: "bungalows jardin", icon: <Sun className="size-5" /> },
  { value: "1h", label: "depuis Tunis", icon: <Compass className="size-5" /> },
];

export function StatsStrip() {
  return (
    <section className="border-y border-border bg-bone">
      <div className="container-x grid grid-cols-2 divide-x divide-border md:grid-cols-4">
        {STATS.map((s, i) => (
          <FadeIn
            key={s.label}
            delay={i === 0 ? undefined : `delay-${i * 75}`}
            className="flex flex-col items-center gap-2 px-4 py-10 text-center sm:py-12"
          >
            <span className="text-clay">{s.icon}</span>
            <span className="heading-display text-5xl text-foreground sm:text-6xl">
              {s.value}
            </span>
            <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              {s.label}
            </span>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
