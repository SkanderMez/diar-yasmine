import {
  CalendarClock,
  CalendarCheck,
  Heart,
  Wrench,
  Star,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatTND } from "@/lib/money";
import { formatLocalized } from "@/lib/date";
import type { AdminUnitCard } from "@/lib/queries";

interface UnitCardProps {
  unit: AdminUnitCard;
}

function statusPill(unit: AdminUnitCard): {
  className: string;
  label: string;
} {
  if (unit.status === "MAINTENANCE") {
    return { className: "maintenance", label: "Maintenance" };
  }
  if (unit.nextEvent.kind === "checkout") {
    const day = formatLocalized(unit.nextEvent.date, "d/MM");
    return {
      className: "occupied",
      label: `Occupé jusqu'au ${day}`,
    };
  }
  return { className: "", label: "Disponible" };
}

function positionLabel(unit: AdminUnitCard): string {
  if (unit.beachfront) return "Front de mer";
  if (unit.hasPrivatePool) return "Piscine";
  if (unit.seaView) return "Vue mer";
  if (unit.type === "BUNGALOW") return "Jardin";
  return "2e ligne";
}

export function UnitCard({ unit }: UnitCardProps) {
  const pill = statusPill(unit);
  const meta = [
    unit.type === "CHALET" ? "Chalet" : "Bungalow",
    unit.sizeM2 ? `${unit.sizeM2} m²` : null,
    `${unit.capacity} voy.`,
    positionLabel(unit),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link href={`/admin/properties/${unit.id}/edit`} className="unit-card">
      <div
        className={`unit-photo${unit.photo ? "" : " unit-photo-fallback"}`}
        style={
          unit.photo
            ? { backgroundImage: `url(${JSON.stringify(unit.photo.url)})` }
            : undefined
        }
      >
        <span className={`unit-status-pill ${pill.className}`.trim()}>
          <span className="dot" />
          {pill.label}
        </span>
        <span className="unit-save" aria-hidden>
          <Heart className="size-3.5" />
        </span>
      </div>

      <div className="unit-card-body">
        <h4>{unit.name}</h4>
        <div className="unit-meta">{meta}</div>

        <div className="unit-stats">
          <div className="unit-stat primary">
            <strong>{formatTND(unit.basePrice)}</strong>
            Tarif nuit
          </div>
          <div className="unit-stat">
            <strong>{unit.occupancyPct}%</strong>
            Occupation
          </div>
          <div className="unit-stat">
            <strong
              style={{
                display: "inline-flex",
                gap: 4,
                alignItems: "center",
              }}
            >
              {unit.demoRating.value.toFixed(1)}
              <Star
                className="size-3"
                style={{ color: "var(--warning)", fill: "var(--warning)" }}
                aria-hidden
              />
            </strong>
            {unit.demoRating.count} avis
          </div>
        </div>

        <UnitNext unit={unit} />
      </div>
    </Link>
  );
}

function UnitNext({ unit }: { unit: AdminUnitCard }) {
  if (unit.status === "MAINTENANCE" || unit.nextEvent.kind === "maintenance") {
    return (
      <div className="unit-next">
        <Wrench className="size-3.5" aria-hidden />
        <span>Maintenance en cours</span>
      </div>
    );
  }
  if (unit.nextEvent.kind === "checkout") {
    return (
      <div className="unit-next">
        <CalendarCheck className="size-3.5" aria-hidden />
        <span>
          Check-out : <strong>{unit.nextEvent.guestName}</strong> ·{" "}
          {formatLocalized(unit.nextEvent.date, "d/MM")}
        </span>
      </div>
    );
  }
  if (unit.nextEvent.kind === "checkin") {
    return (
      <div className="unit-next">
        <CalendarClock className="size-3.5" aria-hidden />
        <span>
          Prochain check-in : <strong>{unit.nextEvent.guestName}</strong> ·{" "}
          {formatLocalized(unit.nextEvent.date, "d/MM")}
        </span>
      </div>
    );
  }
  return (
    <div className="unit-next">
      <CalendarClock className="size-3.5" aria-hidden />
      <span>Aucune réservation à venir</span>
    </div>
  );
}
