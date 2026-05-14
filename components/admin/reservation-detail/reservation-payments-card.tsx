import type { PaymentMethod, PaymentStatus } from "@prisma/client";
import { CreditCard } from "lucide-react";
import { formatLocalized } from "@/lib/date";
import { formatTND } from "@/lib/money";
import type { ReservationDetail } from "@/lib/queries";
import { AddPaymentDialog } from "./add-payment-dialog";

interface ReservationPaymentsCardProps {
  reservation: ReservationDetail["reservation"];
}

const METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Espèces",
  CARD: "Carte",
  TRANSFER: "Virement",
  STRIPE: "Stripe",
  FLOUCI: "Flouci",
  KONNECT: "Konnect",
  OTHER: "Autre",
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "En attente",
  SUCCEEDED: "Reçu",
  FAILED: "Échoué",
  REFUNDED: "Remboursé",
  PARTIALLY_REFUNDED: "Partiellement remboursé",
};

const STATUS_TAG_CLASS: Record<PaymentStatus, string> = {
  PENDING: "tag-option",
  SUCCEEDED: "tag-paid",
  FAILED: "tag-cancelled",
  REFUNDED: "tag-refunded",
  PARTIALLY_REFUNDED: "tag-refunded",
};

/**
 * "Paiements" card — list of recorded payments with date, method tag,
 * status tag, reference, and amount. Renders the AddPaymentDialog
 * trigger in the header and as the empty-state CTA.
 */
export function ReservationPaymentsCard({
  reservation,
}: ReservationPaymentsCardProps) {
  const balance = reservation.total - reservation.paidAmount;
  const payments = reservation.payments;

  return (
    <section className="card-admin reservation-card">
      <header className="card-header">
        <h3>Paiements</h3>
        {balance > 0 ? (
          <AddPaymentDialog
            reservationId={reservation.id}
            remainingBalance={balance}
          />
        ) : null}
      </header>

      <div className="card-body reservation-payments-body">
        {payments.length === 0 ? (
          <div className="reservation-payments-empty">
            <CreditCard className="size-5" aria-hidden />
            <p>Aucun paiement enregistré.</p>
            {balance > 0 ? (
              <AddPaymentDialog
                reservationId={reservation.id}
                remainingBalance={balance}
              />
            ) : null}
          </div>
        ) : (
          <ul className="reservation-payments-list">
            {payments.map((payment) => (
              <li key={payment.id} className="reservation-payments-row">
                <div className="reservation-payments-main">
                  <div className="reservation-payments-tags">
                    <span className="tag reservation-payment-method">
                      {METHOD_LABEL[payment.method]}
                    </span>
                    <span className={`tag ${STATUS_TAG_CLASS[payment.status]}`}>
                      {STATUS_LABEL[payment.status]}
                    </span>
                  </div>
                  <div className="reservation-payments-meta">
                    {formatLocalized(
                      payment.receivedAt,
                      "d MMM yyyy 'à' HH:mm",
                    )}
                    {payment.receivedBy
                      ? ` · ${payment.receivedBy.name}`
                      : null}
                    {payment.reference ? ` · ${payment.reference}` : null}
                  </div>
                </div>
                <span className="reservation-payments-amount">
                  {formatTND(payment.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
