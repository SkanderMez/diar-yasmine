"use client";

import { useState, useTransition } from "react";
import { Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { updateReservationNotes } from "@/lib/reservations";

interface ReservationNotesCardProps {
  reservationId: string;
  initialNotes: string | null;
}

const MAX_LENGTH = 2000;

/**
 * Notes internes card — inline editable textarea. Reads the current
 * value from props, calls `updateReservationNotes` on save, and
 * relies on the server action's revalidatePath to refresh the page.
 */
export function ReservationNotesCard({
  reservationId,
  initialNotes,
}: ReservationNotesCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialNotes ?? "");
  const [pending, startTransition] = useTransition();
  const [currentNotes, setCurrentNotes] = useState(initialNotes);

  function handleEdit() {
    setDraft(currentNotes ?? "");
    setEditing(true);
  }

  function handleCancel() {
    setDraft(currentNotes ?? "");
    setEditing(false);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const next = draft.length > 0 ? draft : null;
        const result = await updateReservationNotes({
          id: reservationId,
          internalNotes: next,
        });
        setCurrentNotes(result.internalNotes);
        setEditing(false);
        toast.success("Notes mises à jour");
      } catch (err) {
        toast.error("Échec de la mise à jour", {
          description: err instanceof Error ? err.message : "Erreur",
        });
      }
    });
  }

  return (
    <section className="card-admin reservation-card">
      <header className="card-header">
        <h3>Notes internes</h3>
        {!editing ? (
          <button
            type="button"
            className="btn-admin btn-admin-ghost btn-admin-sm"
            onClick={handleEdit}
          >
            <Pencil className="size-3.5" aria-hidden />
            {currentNotes ? "Modifier" : "Ajouter"}
          </button>
        ) : null}
      </header>

      <div className="card-body reservation-notes-body">
        {editing ? (
          <>
            <textarea
              className="textarea-admin reservation-notes-textarea"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={MAX_LENGTH}
              rows={5}
              placeholder="Allergies, demandes particulières, contexte interne…"
              disabled={pending}
              aria-label="Notes internes"
            />
            <div className="reservation-notes-footer">
              <span className="reservation-notes-counter">
                {draft.length} / {MAX_LENGTH}
              </span>
              <div className="reservation-notes-actions">
                <button
                  type="button"
                  className="btn-admin btn-admin-ghost btn-admin-sm"
                  onClick={handleCancel}
                  disabled={pending}
                >
                  <X className="size-3.5" aria-hidden />
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn-admin btn-admin-primary btn-admin-sm"
                  onClick={handleSave}
                  disabled={pending}
                >
                  <Save className="size-3.5" aria-hidden />
                  {pending ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </div>
          </>
        ) : currentNotes ? (
          <p className="reservation-notes-text">{currentNotes}</p>
        ) : (
          <p className="reservation-notes-empty">
            Aucune note interne pour cette réservation.
          </p>
        )}
      </div>
    </section>
  );
}
