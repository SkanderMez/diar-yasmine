"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronLeft, Download, Mail, Printer, X } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface VoucherToolbarProps {
  reservationCode: string;
  voucherNumber: string;
  issuedLabel: string;
}

/**
 * Sticky dark toolbar above the voucher paper.
 *
 * - "Retour" → reservation detail.
 * - "Imprimer" → `window.print()` (CSS handles hiding the rest of the page).
 * - "Télécharger PDF" → existing `/api/vouchers/[code]` server-rendered PDF.
 * - "Envoyer par email" → POST stub `/api/admin/reservations/[code]/send-voucher`.
 *
 * The toolbar carries the `.voucher-toolbar` class so the print stylesheet
 * can hide it.
 */
export function VoucherToolbar({
  reservationCode,
  voucherNumber,
  issuedLabel,
}: VoucherToolbarProps) {
  const [pending, startTransition] = useTransition();
  const [sending, setSending] = useState(false);

  function handlePrint() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  function handleSendEmail() {
    if (sending) return;
    setSending(true);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/admin/reservations/${reservationCode}/send-voucher`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          },
        );
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error ?? `HTTP ${res.status}`);
        }
        toast.success("Voucher envoyé", {
          description: "L'email a été ajouté à la file d'envoi.",
        });
      } catch (err) {
        toast.error("Échec de l'envoi", {
          description: err instanceof Error ? err.message : "Erreur inconnue",
        });
      } finally {
        setSending(false);
      }
    });
  }

  return (
    <div
      className="voucher-toolbar"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        padding: "12px 24px",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <Link
          href={`/admin/reservations/${reservationCode}`}
          style={{
            display: "inline-flex",
            gap: 6,
            alignItems: "center",
            color: "var(--text-muted)",
            fontSize: "0.88rem",
            textDecoration: "none",
          }}
        >
          <ChevronLeft size={14} aria-hidden />
          Retour
        </Link>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.1rem",
            fontWeight: 500,
            color: "var(--text)",
            margin: 0,
          }}
        >
          Voucher {voucherNumber}
        </h2>
        <span className="tag tag-confirmed" style={{ whiteSpace: "nowrap" }}>
          Émis · {issuedLabel}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="btn-admin btn-admin-ghost"
          onClick={() => window.history.back()}
        >
          <X size={14} aria-hidden /> Annuler
        </button>
        <button
          type="button"
          className="btn-admin btn-admin-secondary"
          onClick={handlePrint}
        >
          <Printer size={14} aria-hidden /> Imprimer
        </button>
        <a
          className="btn-admin btn-admin-secondary"
          href={`/api/vouchers/${reservationCode}`}
          target="_blank"
          rel="noopener noreferrer"
          download={`voucher-${reservationCode}.pdf`}
        >
          <Download size={14} aria-hidden /> Télécharger PDF
        </a>
        <button
          type="button"
          className="btn-admin btn-admin-primary"
          onClick={handleSendEmail}
          disabled={pending || sending}
        >
          <Mail size={14} aria-hidden />
          {sending ? "Envoi…" : "Envoyer par email"}
        </button>
      </div>
    </div>
  );
}
