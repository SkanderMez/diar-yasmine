import type { ReactNode } from "react";

interface SpecItem {
  icon: ReactNode;
  value: string;
  label: string;
}

interface PropertySpecsGridProps {
  items: SpecItem[];
}

/**
 * Maquette `.specs-grid` — 4 sand-bg cells with icon, big Fraunces value
 * and uppercase muted label. Collapses to 2 columns on small viewports.
 */
export function PropertySpecsGrid({ items }: PropertySpecsGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((item, i) => (
        <li
          key={`${item.label}-${i}`}
          className="rounded-md bg-sand px-3 py-5 text-center"
        >
          <div className="flex justify-center text-primary">{item.icon}</div>
          <div className="mt-2 font-heading text-2xl text-charcoal">
            {item.value}
          </div>
          <div className="mt-0.5 text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground">
            {item.label}
          </div>
        </li>
      ))}
    </ul>
  );
}
