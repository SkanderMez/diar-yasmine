import type { DashboardKpis } from "@/lib/queries";

interface DashboardKpiCardsProps {
  kpis: DashboardKpis;
}

interface Card {
  label: string;
  value: string;
  unit?: string;
  hint: string;
  /** Emoji glyph rendered in the KPI icon tile — padel-dashboard signature. */
  emoji: string;
  tone: "default" | "warning";
}

/**
 * 4-card KPI row at the top of the dashboard. Pure presentation — `kpis`
 * comes from `getDashboardData()`. Each card surfaces an emoji glyph
 * (Apple system) instead of a Lucide icon so the tone matches the
 * padel-style reference: friendly, colourful, immediately readable.
 */
export function DashboardKpiCards({ kpis }: DashboardKpiCardsProps) {
  const cards: Card[] = [
    {
      label: "Arrivées aujourd'hui",
      value: String(kpis.checkinsToday),
      hint:
        kpis.checkinsToday === 0
          ? "Aucune arrivée prévue"
          : kpis.checkinsToday === 1
            ? "Stay à préparer"
            : `${kpis.checkinsToday} stays à préparer`,
      emoji: "🛬",
      tone: "default",
    },
    {
      label: "Départs aujourd'hui",
      value: String(kpis.checkoutsToday),
      hint:
        kpis.checkoutsToday === 0
          ? "Aucun départ prévu"
          : kpis.checkoutsToday === 1
            ? "Voucher à clôturer"
            : `${kpis.checkoutsToday} vouchers à clôturer`,
      emoji: "🛫",
      tone: "default",
    },
    {
      label: "Occupation actuelle",
      value: String(kpis.occupancyPct),
      unit: "%",
      hint: "Sur l'ensemble des unités actives",
      emoji: "📊",
      tone: "default",
    },
    {
      label: "Paiements en attente",
      value: String(kpis.pendingPayments),
      hint:
        kpis.pendingPayments === 0
          ? "Caisse à jour"
          : `${kpis.pendingPayments} solde${kpis.pendingPayments > 1 ? "s" : ""} à relancer`,
      emoji: "💰",
      tone: kpis.pendingPayments > 0 ? "warning" : "default",
    },
  ];

  return (
    <div className="dashboard-kpi-row">
      {cards.map((card) => (
        <article
          key={card.label}
          className={`dashboard-kpi${card.tone === "warning" ? " dashboard-kpi-warning" : ""}`}
        >
          <div
            className="dashboard-kpi-icon dashboard-kpi-icon-emoji"
            aria-hidden="true"
          >
            {card.emoji}
          </div>
          <div className="dashboard-kpi-label">{card.label}</div>
          <div className="dashboard-kpi-value">
            {card.value}
            {card.unit ? (
              <span className="dashboard-kpi-unit">{card.unit}</span>
            ) : null}
          </div>
          <div className="dashboard-kpi-hint">{card.hint}</div>
        </article>
      ))}
    </div>
  );
}
