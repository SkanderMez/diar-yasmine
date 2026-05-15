"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deletePromoCode,
  togglePromoCode,
  upsertPromoCode,
} from "@/lib/promo-codes-actions";
import { formatTND } from "@/lib/money";
import type { PromoCodeRow } from "@/lib/queries";

interface Props {
  rows: PromoCodeRow[];
}

type DraftKind = "PERCENT" | "FIXED";

interface Draft {
  id?: string;
  code: string;
  label: string;
  kind: DraftKind;
  value: string;
  minNights: string;
  propertyType: "ANY" | "CHALET" | "BUNGALOW";
  maxUses: string;
  validFrom: string;
  validTo: string;
  active: boolean;
}

const EMPTY_DRAFT: Draft = {
  code: "",
  label: "",
  kind: "PERCENT",
  value: "10",
  minNights: "0",
  propertyType: "ANY",
  maxUses: "0",
  validFrom: "",
  validTo: "",
  active: true,
};

function rowToDraft(row: PromoCodeRow): Draft {
  return {
    id: row.id,
    code: row.code,
    label: row.label ?? "",
    kind: row.kind,
    value:
      row.kind === "PERCENT"
        ? String(row.value)
        : (row.value / 1000).toString(),
    minNights: String(row.minNights),
    propertyType: row.propertyType ?? "ANY",
    maxUses: String(row.maxUses),
    validFrom: row.validFrom ? row.validFrom.toISOString().slice(0, 10) : "",
    validTo: row.validTo ? row.validTo.toISOString().slice(0, 10) : "",
    active: row.active,
  };
}

export function PromoCodesClient({ rows }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!draft) return;
    startTransition(async () => {
      try {
        await upsertPromoCode({
          id: draft.id,
          code: draft.code.trim().toUpperCase(),
          label: draft.label.trim() || undefined,
          kind: draft.kind,
          value: Number(draft.value),
          minNights: Number(draft.minNights) || 0,
          propertyType:
            draft.propertyType === "ANY" ? null : draft.propertyType,
          maxUses: Number(draft.maxUses) || 0,
          validFrom: draft.validFrom || undefined,
          validTo: draft.validTo || undefined,
          active: draft.active,
        });
        toast.success(draft.id ? "Code mis à jour" : "Code créé");
        setDraft(null);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur");
      }
    });
  }

  function toggle(row: PromoCodeRow) {
    startTransition(async () => {
      try {
        await togglePromoCode({ id: row.id, active: !row.active });
        toast.success(row.active ? "Code désactivé" : "Code activé");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur");
      }
    });
  }

  function remove(row: PromoCodeRow) {
    const used = row._count.redemptions > 0;
    const msg = used
      ? "Ce code a déjà été utilisé. Il sera archivé plutôt que supprimé."
      : "Supprimer ce code définitivement ?";
    if (!window.confirm(msg)) return;
    startTransition(async () => {
      try {
        await deletePromoCode({ id: row.id });
        toast.success(used ? "Code archivé" : "Code supprimé");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur");
      }
    });
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Codes promo</h1>
          <p>
            Réductions appliquées dans le tunnel public et le wizard
            réservation.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn-admin btn-admin-primary"
            onClick={() => setDraft({ ...EMPTY_DRAFT })}
          >
            <Plus className="size-3.5" />
            Nouveau code
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="placeholder-card">
          <p>Aucun code promo. Créez-en un pour démarrer une campagne.</p>
        </div>
      ) : (
        <div className="card-admin">
          <table className="users-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Réduction</th>
                <th>Validité</th>
                <th>Usages</th>
                <th>Statut</th>
                <th style={{ width: 110 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={r.active ? "" : "muted-row"}>
                  <td>
                    <code className="promo-code-cell">{r.code}</code>
                    {r.label && (
                      <div className="promo-code-label">{r.label}</div>
                    )}
                  </td>
                  <td>
                    {r.kind === "PERCENT" ? `${r.value} %` : formatTND(r.value)}
                    {r.minNights > 0 && (
                      <div className="promo-code-sub">
                        min. {r.minNights} nuits
                      </div>
                    )}
                    {r.propertyType && (
                      <div className="promo-code-sub">
                        {r.propertyType === "CHALET"
                          ? "Chalets uniquement"
                          : "Bungalows uniquement"}
                      </div>
                    )}
                  </td>
                  <td>
                    {r.validFrom || r.validTo ? (
                      <>
                        {r.validFrom
                          ? new Date(r.validFrom).toLocaleDateString("fr-FR")
                          : "—"}
                        {" → "}
                        {r.validTo
                          ? new Date(r.validTo).toLocaleDateString("fr-FR")
                          : "∞"}
                      </>
                    ) : (
                      "Toujours"
                    )}
                  </td>
                  <td>
                    {r._count.redemptions}
                    {r.maxUses > 0 ? ` / ${r.maxUses}` : ""}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`status-switch${r.active ? " active" : ""}`}
                      onClick={() => toggle(r)}
                      disabled={pending}
                      aria-pressed={r.active}
                    >
                      {r.active ? "Actif" : "Inactif"}
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-admin btn-admin-ghost btn-admin-sm"
                      onClick={() => setDraft(rowToDraft(r))}
                      aria-label="Modifier"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="btn-admin btn-admin-ghost btn-admin-sm"
                      onClick={() => remove(r)}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {draft && (
        <div
          className="modal-backdrop"
          onClick={() => !pending && setDraft(null)}
        >
          <div
            className="modal-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <header className="modal-head">
              <h2>{draft.id ? "Modifier le code" : "Nouveau code promo"}</h2>
            </header>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="modal-body promo-code-form"
            >
              <label>
                <span>Code</span>
                <input
                  className="input-admin"
                  value={draft.code}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  required
                  pattern="[A-Z0-9_-]{3,40}"
                  placeholder="ETE2026"
                />
              </label>
              <label>
                <span>Libellé interne</span>
                <input
                  className="input-admin"
                  value={draft.label}
                  onChange={(e) =>
                    setDraft({ ...draft, label: e.target.value })
                  }
                  placeholder="Soldes été"
                />
              </label>
              <div className="promo-code-form-row">
                <label>
                  <span>Type</span>
                  <select
                    className="select-admin"
                    value={draft.kind}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        kind: e.target.value as DraftKind,
                      })
                    }
                  >
                    <option value="PERCENT">Pourcentage</option>
                    <option value="FIXED">Montant fixe (TND)</option>
                  </select>
                </label>
                <label>
                  <span>Valeur</span>
                  <input
                    className="input-admin"
                    type="number"
                    min={0}
                    step={draft.kind === "PERCENT" ? 1 : 0.001}
                    value={draft.value}
                    onChange={(e) =>
                      setDraft({ ...draft, value: e.target.value })
                    }
                    required
                  />
                </label>
              </div>
              <div className="promo-code-form-row">
                <label>
                  <span>Nuits min.</span>
                  <input
                    className="input-admin"
                    type="number"
                    min={0}
                    value={draft.minNights}
                    onChange={(e) =>
                      setDraft({ ...draft, minNights: e.target.value })
                    }
                  />
                </label>
                <label>
                  <span>Type de bien</span>
                  <select
                    className="select-admin"
                    value={draft.propertyType}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        propertyType: e.target.value as Draft["propertyType"],
                      })
                    }
                  >
                    <option value="ANY">Tous</option>
                    <option value="CHALET">Chalets</option>
                    <option value="BUNGALOW">Bungalows</option>
                  </select>
                </label>
                <label>
                  <span>Max usages (0 = ∞)</span>
                  <input
                    className="input-admin"
                    type="number"
                    min={0}
                    value={draft.maxUses}
                    onChange={(e) =>
                      setDraft({ ...draft, maxUses: e.target.value })
                    }
                  />
                </label>
              </div>
              <div className="promo-code-form-row">
                <label>
                  <span>Valide du</span>
                  <input
                    className="input-admin"
                    type="date"
                    value={draft.validFrom}
                    onChange={(e) =>
                      setDraft({ ...draft, validFrom: e.target.value })
                    }
                  />
                </label>
                <label>
                  <span>Jusqu&apos;au</span>
                  <input
                    className="input-admin"
                    type="date"
                    value={draft.validTo}
                    onChange={(e) =>
                      setDraft({ ...draft, validTo: e.target.value })
                    }
                  />
                </label>
              </div>
              <label className="promo-code-checkbox">
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(e) =>
                    setDraft({ ...draft, active: e.target.checked })
                  }
                />
                Code actif
              </label>
              <footer className="modal-foot">
                <button
                  type="button"
                  className="btn-admin btn-admin-ghost"
                  onClick={() => setDraft(null)}
                  disabled={pending}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-admin btn-admin-primary"
                  disabled={pending}
                >
                  Enregistrer
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
