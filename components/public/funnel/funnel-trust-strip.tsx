import { CalendarX, ShieldCheck, Star } from "lucide-react";

/**
 * Maquette `.trust-strip` — three reassuring stats below the action footer.
 * Server Component (no interactivity), inline icons with bullet dividers.
 */
export function FunnelTrustStrip() {
  const items: ReadonlyArray<{ icon: React.ReactNode; label: string }> = [
    {
      icon: <ShieldCheck className="size-4" />,
      label: "Paiement sécurisé SSL",
    },
    {
      icon: <CalendarX className="size-4" />,
      label: "Annulation gratuite J-7",
    },
    {
      icon: (
        <Star
          className="size-4 text-gold"
          fill="currentColor"
          strokeWidth={0}
        />
      ),
      label: "4,9 / 5 sur 127 séjours",
    },
  ];

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
      {items.map((item, i) => (
        <span key={item.label} className="inline-flex items-center gap-3">
          {i > 0 && (
            <span aria-hidden className="text-line">
              ·
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            {item.icon}
            {item.label}
          </span>
        </span>
      ))}
    </div>
  );
}
