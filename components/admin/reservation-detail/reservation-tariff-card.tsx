import { formatTND } from "@/lib/money";
import type { ReservationDetail } from "@/lib/queries";

interface ReservationTariffCardProps {
  reservation: ReservationDetail["reservation"];
}

interface ExtraLine {
  label: string;
  amount: number;
}

function readExtras(value: unknown): ExtraLine[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (
        typeof row === "object" &&
        row !== null &&
        "label" in row &&
        "amount" in row
      ) {
        const r = row as { label: unknown; amount: unknown };
        if (typeof r.label === "string" && typeof r.amount === "number") {
          return { label: r.label, amount: r.amount } satisfies ExtraLine;
        }
      }
      return null;
    })
    .filter((row): row is ExtraLine => row !== null);
}

/**
 * "Tarif" card — line-by-line pricing breakdown, matching the new-booking
 * summary aside in the maquette. Amounts are right-aligned mono; the
 * "Total" + "Solde dû" rows are emphasised (primary / warning colors).
 */
export function ReservationTariffCard({
  reservation,
}: ReservationTariffCardProps) {
  const extras = readExtras(reservation.extras);
  const balance = reservation.total - reservation.paidAmount;
  const nightlyRate =
    reservation.nights > 0
      ? Math.round(reservation.basePrice / reservation.nights)
      : 0;

  return (
    <section className="card-admin reservation-card">
      <header className="card-header">
        <h3>Tarif</h3>
      </header>
      <div className="card-body reservation-tariff-body">
        <div className="reservation-tariff-row">
          <span className="label">
            {reservation.nights} nuit{reservation.nights > 1 ? "s" : ""} ×{" "}
            {formatTND(nightlyRate)}
          </span>
          <span className="value">{formatTND(reservation.basePrice)}</span>
        </div>

        {reservation.discountAmount > 0 ? (
          <div className="reservation-tariff-row reservation-tariff-row-success">
            <span className="label">Remise</span>
            <span className="value">
              −{formatTND(reservation.discountAmount)}
            </span>
          </div>
        ) : null}

        {extras.map((extra, index) => (
          <div
            className="reservation-tariff-row"
            key={`${extra.label}-${index}`}
          >
            <span className="label">{extra.label}</span>
            <span className="value">{formatTND(extra.amount)}</span>
          </div>
        ))}

        <div className="reservation-tariff-row reservation-tariff-row-muted">
          <span className="label">Sous-total HT</span>
          <span className="value">{formatTND(reservation.subtotal)}</span>
        </div>

        {reservation.tax > 0 ? (
          <div className="reservation-tariff-row reservation-tariff-row-muted">
            <span className="label">TVA</span>
            <span className="value">{formatTND(reservation.tax)}</span>
          </div>
        ) : null}

        <div className="reservation-tariff-total">
          <span className="label">Total TTC</span>
          <span className="value">{formatTND(reservation.total)}</span>
        </div>

        <div className="reservation-tariff-balance">
          <div className="reservation-tariff-balance-row">
            <span className="label">Payé</span>
            <span className="value">{formatTND(reservation.paidAmount)}</span>
          </div>
          <div
            className={`reservation-tariff-balance-row reservation-tariff-balance-row-emphasis ${
              balance > 0
                ? "reservation-tariff-balance-row-warning"
                : "reservation-tariff-balance-row-success"
            }`}
          >
            <span className="label">
              {balance > 0 ? "Solde dû" : "Solde réglé"}
            </span>
            <span className="value">{formatTND(Math.max(balance, 0))}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
