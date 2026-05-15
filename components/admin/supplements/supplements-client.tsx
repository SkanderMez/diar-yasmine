"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteSupplement,
  toggleSupplement,
  upsertSupplement,
} from "@/lib/supplements-actions";
import { formatTND } from "@/lib/money";
import type { SupplementRow } from "@/lib/queries";

interface Props {
  rows: SupplementRow[];
}

interface Draft {
  id?: string;
  slug: string;
  labelFr: string;
  labelEn: string;
  labelAr: string;
  priceTnd: string;
  category: string;
  icon: string;
  sortOrder: string;
  active: boolean;
}

const EMPTY_DRAFT: Draft = {
  slug: "",
  labelFr: "",
  labelEn: "",
  labelAr: "",
  priceTnd: "0",
  category: "",
  icon: "",
  sortOrder: "100",
  active: true,
};

function rowToDraft(row: SupplementRow): Draft {
  return {
    id: row.id,
    slug: row.slug,
    labelFr: row.labelFr,
    labelEn: row.labelEn ?? "",
    labelAr: row.labelAr ?? "",
    priceTnd: (row.priceMillimes / 1000).toString(),
    category: row.category ?? "",
    icon: row.icon ?? "",
    sortOrder: String(row.sortOrder),
    active: row.active,
  };
}

export function SupplementsClient({ rows }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!draft) return;
    startTransition(async () => {
      try {
        await upsertSupplement({
          id: draft.id,
          slug: draft.slug.trim(),
          labelFr: draft.labelFr.trim(),
          labelEn: draft.labelEn.trim() || undefined,
          labelAr: draft.labelAr.trim() || undefined,
          priceTnd: Number(draft.priceTnd),
          category: draft.category.trim() || undefined,
          icon: draft.icon.trim() || undefined,
          sortOrder: Number(draft.sortOrder) || 100,
          active: draft.active,
        });
        toast.success(draft.id ? "Supplément mis à jour" : "Supplément créé");
        setDraft(null);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur");
      }
    });
  }

  function toggle(row: SupplementRow) {
    startTransition(async () => {
      try {
        await toggleSupplement({ id: row.id, active: !row.active });
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur");
      }
    });
  }

  function remove(row: SupplementRow) {
    if (!window.confirm("Supprimer ce supplément ?")) return;
    startTransition(async () => {
      try {
        await deleteSupplement({ id: row.id });
        toast.success("Supplément supprimé");
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
          <h1>Suppléments tarifaires</h1>
          <p>
            Catalogue de prestations en option (ménage final, padel, transfert…)
            proposées comme presets dans le tunnel et le wizard.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn-admin btn-admin-primary"
            onClick={() => setDraft({ ...EMPTY_DRAFT })}
          >
            <Plus className="size-3.5" />
            Nouveau supplément
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="placeholder-card">
          <p>Aucun supplément. Démarrez avec « Ménage final » ou « Padel ».</p>
        </div>
      ) : (
        <div className="card-admin">
          <table className="users-table">
            <thead>
              <tr>
                <th>Slug</th>
                <th>Libellé</th>
                <th>Prix</th>
                <th>Catégorie</th>
                <th>Ordre</th>
                <th>Statut</th>
                <th style={{ width: 110 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={r.active ? "" : "muted-row"}>
                  <td>
                    <code className="promo-code-cell">{r.slug}</code>
                  </td>
                  <td>
                    <div>{r.labelFr}</div>
                    {(r.labelEn || r.labelAr) && (
                      <div className="promo-code-sub">
                        {r.labelEn && <span>EN: {r.labelEn}</span>}
                        {r.labelEn && r.labelAr && " · "}
                        {r.labelAr && <span>AR: {r.labelAr}</span>}
                      </div>
                    )}
                  </td>
                  <td>{formatTND(r.priceMillimes)}</td>
                  <td>{r.category ?? "—"}</td>
                  <td>{r.sortOrder}</td>
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
              <h2>
                {draft.id ? "Modifier le supplément" : "Nouveau supplément"}
              </h2>
            </header>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="modal-body promo-code-form"
            >
              <label>
                <span>Slug</span>
                <input
                  className="input-admin"
                  value={draft.slug}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "-"),
                    })
                  }
                  required
                  pattern="[a-z0-9-]{2,60}"
                  placeholder="menage-final"
                />
              </label>
              <label>
                <span>Libellé FR</span>
                <input
                  className="input-admin"
                  value={draft.labelFr}
                  onChange={(e) =>
                    setDraft({ ...draft, labelFr: e.target.value })
                  }
                  required
                  placeholder="Ménage final"
                />
              </label>
              <div className="promo-code-form-row">
                <label>
                  <span>Libellé EN</span>
                  <input
                    className="input-admin"
                    value={draft.labelEn}
                    onChange={(e) =>
                      setDraft({ ...draft, labelEn: e.target.value })
                    }
                  />
                </label>
                <label>
                  <span>Libellé AR</span>
                  <input
                    className="input-admin"
                    value={draft.labelAr}
                    onChange={(e) =>
                      setDraft({ ...draft, labelAr: e.target.value })
                    }
                    dir="rtl"
                  />
                </label>
              </div>
              <div className="promo-code-form-row">
                <label>
                  <span>Prix (TND)</span>
                  <input
                    className="input-admin"
                    type="number"
                    min={0}
                    step={0.001}
                    value={draft.priceTnd}
                    onChange={(e) =>
                      setDraft({ ...draft, priceTnd: e.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  <span>Catégorie</span>
                  <input
                    className="input-admin"
                    value={draft.category}
                    onChange={(e) =>
                      setDraft({ ...draft, category: e.target.value })
                    }
                    placeholder="Services / Loisirs"
                  />
                </label>
                <label>
                  <span>Ordre</span>
                  <input
                    className="input-admin"
                    type="number"
                    min={0}
                    value={draft.sortOrder}
                    onChange={(e) =>
                      setDraft({ ...draft, sortOrder: e.target.value })
                    }
                  />
                </label>
              </div>
              <label>
                <span>Icône (nom lucide, optionnel)</span>
                <input
                  className="input-admin"
                  value={draft.icon}
                  onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                  placeholder="Sparkles"
                />
              </label>
              <label className="promo-code-checkbox">
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(e) =>
                    setDraft({ ...draft, active: e.target.checked })
                  }
                />
                Supplément actif
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
