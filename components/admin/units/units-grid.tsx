import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { AdminUnitCard } from "@/lib/queries";
import { UnitCard } from "./unit-card";

interface UnitsGridProps {
  units: AdminUnitCard[];
  title: string;
  count: number;
  showAllHref: string;
}

export function UnitsGrid({
  units,
  title,
  count,
  showAllHref,
}: UnitsGridProps) {
  return (
    <section className="units-section">
      <div className="units-section-head">
        <h2>
          {title} <span className="count">{count} unités</span>
        </h2>
        <Link
          href={showAllHref}
          className="btn-admin btn-admin-ghost btn-admin-sm"
        >
          Voir tout
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
      {units.length === 0 ? (
        <div className="units-empty">
          Aucune unité ne correspond aux filtres.
        </div>
      ) : (
        <div className="units-grid">
          {units.map((unit) => (
            <UnitCard key={unit.id} unit={unit} />
          ))}
        </div>
      )}
    </section>
  );
}
