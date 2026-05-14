"use client";

import { FileText, MoreVertical, Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { DrawerReservation } from "@/lib/queries";
import { formatTND } from "@/lib/money";
import { formatLocalized, nightsBetween } from "@/lib/date";
import {
  CHANNEL_LABEL,
  channelKeyFromSource,
  paymentBucket,
  RESERVATION_STATUS_LABEL,
} from "./types";

interface ReservationDrawerProps {
  reservationId: string | null;
  onClose: () => void;
}

const AUDIT_ACTION_LABEL: Record<string, string> = {
  "reservation.created": "Réservation créée",
  "reservation.confirmed": "Confirmée",
  "reservation.cancelled": "Annulée",
  "reservation.checked_in": "Arrivée enregistrée",
  "reservation.checked_out": "Départ enregistré",
  "reservation.no_show": "No-show",
  "reservation.updated": "Réservation modifiée",
  "reservation.imported_from_channel": "Importée du canal",
  "reservation.updated_via_channel_sync": "Synchronisée du canal",
  "reservation.cancelled_via_channel_sync": "Annulée via canal",
  "payment.received": "Paiement reçu",
  "payment.refunded": "Paiement remboursé",
  "voucher.generated": "Voucher généré",
  "voucher.sent": "Voucher envoyé",
};

function labelForAuditAction(action: string): string {
  return AUDIT_ACTION_LABEL[action] ?? action;
}

export function ReservationDrawer({
  reservationId,
  onClose,
}: ReservationDrawerProps) {
  if (!reservationId) return null;
  return (
    <DrawerShell
      key={reservationId}
      reservationId={reservationId}
      onClose={onClose}
    />
  );
}

function DrawerShell({
  reservationId,
  onClose,
}: {
  reservationId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<DrawerReservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/reservations/${reservationId}/drawer`, {
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as DrawerReservation;
        if (!cancelled) setData(json);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Erreur");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reservationId]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div
        className="drawer-overlay"
        role="button"
        tabIndex={-1}
        aria-label="Fermer le panneau"
        onClick={onClose}
      />
      <aside
        className="drawer-admin"
        data-state="open"
        role="dialog"
        aria-modal="true"
      >
        {loading || !data ? (
          <DrawerSkeleton onClose={onClose} error={error} />
        ) : (
          <DrawerContent data={data} onClose={onClose} />
        )}
      </aside>
    </>
  );
}

function DrawerSkeleton({
  onClose,
  error,
}: {
  onClose: () => void;
  error: string | null;
}) {
  return (
    <>
      <div className="drawer-header">
        <span className="text-muted-admin" style={{ fontSize: "0.85rem" }}>
          {error ? `Erreur · ${error}` : "Chargement…"}
        </span>
        <button
          type="button"
          className="icon-btn"
          aria-label="Fermer"
          onClick={onClose}
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="drawer-body">
        {!error ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: 8,
            }}
          >
            <div
              style={{
                height: 160,
                background: "var(--bg-surface-2)",
                borderRadius: "var(--radius)",
              }}
            />
            <div
              style={{
                height: 16,
                background: "var(--bg-surface-2)",
                borderRadius: 4,
                width: "60%",
              }}
            />
            <div
              style={{
                height: 16,
                background: "var(--bg-surface-2)",
                borderRadius: 4,
                width: "80%",
              }}
            />
            <div
              style={{
                height: 16,
                background: "var(--bg-surface-2)",
                borderRadius: 4,
                width: "40%",
              }}
            />
          </div>
        ) : null}
      </div>
    </>
  );
}

function DrawerContent({
  data,
  onClose,
}: {
  data: DrawerReservation;
  onClose: () => void;
}) {
  const { reservation, audit } = data;
  const channel = channelKeyFromSource(reservation.source);
  const channelLabel = CHANNEL_LABEL[channel];
  const statusLabel = RESERVATION_STATUS_LABEL[reservation.status];
  const nights = nightsBetween(reservation.checkIn, reservation.checkOut);
  const balance = reservation.total - reservation.paidAmount;
  const pay = paymentBucket(reservation.total, reservation.paidAmount);
  const heroPhotoUrl = reservation.property.photos[0]?.url ?? null;
  const propertyTypeLabel =
    reservation.property.type === "CHALET" ? "Chalet" : "Bungalow";
  const positionLabel = reservation.property.beachfront
    ? "Front de mer"
    : reservation.property.seaView
      ? "Vue mer"
      : reservation.property.hasPrivatePool
        ? "Piscine privée"
        : reservation.property.type === "CHALET"
          ? "2e ligne"
          : "Jardin";

  const channelTagClass =
    channel === "direct"
      ? "tag-direct"
      : channel === "booking"
        ? "tag-booking"
        : channel === "airbnb"
          ? "tag-airbnb"
          : channel === "expedia"
            ? "tag-expedia"
            : "tag-walkin";
  const statusTagClass =
    reservation.status === "PENDING"
      ? "tag-option"
      : reservation.status === "CHECKED_IN"
        ? "tag-checkin"
        : reservation.status === "CHECKED_OUT"
          ? "tag-checkout"
          : reservation.status === "CANCELLED" ||
              reservation.status === "NO_SHOW"
            ? "tag-cancelled"
            : "tag-confirmed";
  const payTagClass =
    pay === "paid"
      ? "tag-paid"
      : pay === "deposit"
        ? "tag-deposit"
        : pay === "refunded"
          ? "tag-refunded"
          : "tag-unpaid";
  const payTagLabel =
    pay === "paid"
      ? "Réglée"
      : pay === "deposit"
        ? "Acompte reçu"
        : pay === "refunded"
          ? "Remboursée"
          : "Non payée";

  return (
    <>
      <div className="drawer-header">
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span className={`tag ${statusTagClass}`}>{statusLabel}</span>
          <span className={`tag ${channelTagClass}`}>{channelLabel}</span>
          <span className={`tag ${payTagClass}`}>{payTagLabel}</span>
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label="Fermer"
          onClick={onClose}
        >
          <X className="size-4" />
        </button>
      </div>

      <div
        className="drawer-image"
        style={
          heroPhotoUrl ? { backgroundImage: `url(${heroPhotoUrl})` } : undefined
        }
      >
        <div className="drawer-image-label">
          <div className="name">{reservation.property.name}</div>
          <div className="meta">
            {propertyTypeLabel} · {reservation.property.capacity} voyageurs ·{" "}
            {positionLabel}
          </div>
        </div>
      </div>

      <div className="drawer-body">
        <div className="drawer-section" style={{ paddingTop: 12 }}>
          <h4>Voyageur</h4>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              className="user-avatar"
              style={{ width: 40, height: 40 }}
              aria-hidden
            >
              {reservation.guest.firstName[0] ?? ""}
              {reservation.guest.lastName[0] ?? ""}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 500 }}>
                {reservation.guest.firstName} {reservation.guest.lastName}
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {reservation.guest.phone}
                {reservation.guest.email ? ` · ${reservation.guest.email}` : ""}
                {reservation.guest.country
                  ? ` · ${reservation.guest.country}`
                  : ""}
              </div>
            </div>
          </div>
        </div>

        <div className="drawer-section">
          <h4>Séjour</h4>
          <div className="info-pair">
            <span className="label">Arrivée</span>
            <span className="value">
              {formatLocalized(reservation.checkIn, "EEE d MMM yyyy")}
            </span>
          </div>
          <div className="info-pair">
            <span className="label">Départ</span>
            <span className="value">
              {formatLocalized(reservation.checkOut, "EEE d MMM yyyy")}
            </span>
          </div>
          <div className="info-pair">
            <span className="label">Durée</span>
            <span className="value">
              {nights} nuit{nights > 1 ? "s" : ""}
            </span>
          </div>
          <div className="info-pair">
            <span className="label">Voyageurs</span>
            <span className="value">
              {reservation.adults} adulte
              {reservation.adults > 1 ? "s" : ""}
              {reservation.children > 0
                ? `, ${reservation.children} enfant${reservation.children > 1 ? "s" : ""}`
                : ""}
            </span>
          </div>
        </div>

        <div className="drawer-section">
          <h4>Tarification</h4>
          <div className="info-pair">
            <span className="label">
              {reservation.nights} nuits ·{" "}
              {formatTND(
                Math.round(reservation.basePrice / reservation.nights),
              )}{" "}
              / nuit
            </span>
            <span className="value">{formatTND(reservation.basePrice)}</span>
          </div>
          {reservation.discountAmount > 0 ? (
            <div className="info-pair">
              <span className="label" style={{ color: "var(--success)" }}>
                Remise
              </span>
              <span className="value" style={{ color: "var(--success)" }}>
                −{formatTND(reservation.discountAmount)}
              </span>
            </div>
          ) : null}
          {reservation.extrasTotal > 0 ? (
            <div className="info-pair">
              <span className="label">Extras</span>
              <span className="value">
                {formatTND(reservation.extrasTotal)}
              </span>
            </div>
          ) : null}
          {reservation.tax > 0 ? (
            <div className="info-pair">
              <span className="label">Taxe</span>
              <span className="value">{formatTND(reservation.tax)}</span>
            </div>
          ) : null}
          <div className="price-total">
            <span>Total TTC</span>
            <span className="value">{formatTND(reservation.total)}</span>
          </div>
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              background: "var(--bg-surface-2)",
              borderRadius: 6,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "3px 0",
                fontSize: "0.85rem",
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>Acompte reçu</span>
              <span className="text-success" style={{ fontWeight: 600 }}>
                {reservation.paidAmount > 0 ? "✓ " : ""}
                {formatTND(reservation.paidAmount)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "3px 0",
                fontSize: "0.85rem",
                borderTop: "1px dashed var(--border)",
                marginTop: 6,
                paddingTop: 8,
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>
                Solde {balance > 0 ? "dû à l'arrivée" : ""}
              </span>
              <span
                style={{
                  color: balance > 0 ? "var(--warning)" : "var(--success)",
                  fontWeight: 600,
                }}
              >
                {formatTND(Math.max(balance, 0))}
              </span>
            </div>
          </div>
        </div>

        {reservation.guestRequests || reservation.internalNotes ? (
          <div className="drawer-section">
            <h4>Notes</h4>
            <div
              style={{
                background: "var(--bg-surface-2)",
                borderRadius: 6,
                padding: "10px 12px",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                whiteSpace: "pre-wrap",
              }}
            >
              {reservation.guestRequests || reservation.internalNotes || "—"}
            </div>
          </div>
        ) : null}

        <div className="drawer-section">
          <h4>Activité</h4>
          {audit.length === 0 ? (
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Aucune activité enregistrée.
            </div>
          ) : (
            <div
              style={{
                fontSize: "0.82rem",
                color: "var(--text-muted)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {audit.map((entry) => (
                <div key={entry.id}>
                  · {labelForAuditAction(entry.action)}
                  {entry.user?.name ? ` par ${entry.user.name}` : ""} —{" "}
                  {formatLocalized(entry.timestamp, "d MMM yyyy")}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="drawer-footer">
        <a
          href={`/api/vouchers/${reservation.code}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-admin btn-admin-secondary"
          style={{ flex: 1, justifyContent: "center" }}
        >
          <FileText className="size-3.5" />
          Voucher
        </a>
        <a
          href={`/admin/reservations/${reservation.code}`}
          className="btn-admin btn-admin-primary"
          style={{ flex: 1, justifyContent: "center" }}
        >
          <Pencil className="size-3.5" />
          Modifier
        </a>
        <button type="button" className="icon-btn" aria-label="Plus d'actions">
          <MoreVertical className="size-4" />
        </button>
      </div>
    </>
  );
}
