import type { ReservationSource } from "@prisma/client";

const ITEMS: { source: ReservationSource; label: string; className: string }[] =
  [
    {
      source: "DIRECT_WEB",
      label: "Site direct",
      className: "bg-source-direct-web",
    },
    { source: "WALK_IN", label: "Walk-in", className: "bg-source-walk-in" },
    { source: "PHONE", label: "Téléphone", className: "bg-source-phone" },
    { source: "PARTNER", label: "Partenaire", className: "bg-source-partner" },
    { source: "BOOKING", label: "Booking", className: "bg-source-booking" },
    { source: "AIRBNB", label: "Airbnb", className: "bg-source-airbnb" },
    { source: "EXPEDIA", label: "Expedia", className: "bg-source-expedia" },
    { source: "OTHER", label: "Autre", className: "bg-source-other" },
  ];

export function SourceLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <span className="text-muted-foreground">Sources :</span>
      {ITEMS.map((item) => (
        <span key={item.source} className="inline-flex items-center gap-1.5">
          <span className={`size-3 rounded-sm ${item.className}`} aria-hidden />
          <span className="text-foreground/80">{item.label}</span>
        </span>
      ))}
    </div>
  );
}

/** Tailwind class name for a reservation block, keyed by source. */
export function sourceBgClass(source: ReservationSource): string {
  switch (source) {
    case "DIRECT_WEB":
      return "bg-source-direct-web";
    case "WALK_IN":
      return "bg-source-walk-in";
    case "PHONE":
      return "bg-source-phone";
    case "PARTNER":
      return "bg-source-partner";
    case "BOOKING":
      return "bg-source-booking";
    case "AIRBNB":
      return "bg-source-airbnb";
    case "EXPEDIA":
      return "bg-source-expedia";
    case "OTHER":
    default:
      return "bg-source-other";
  }
}
