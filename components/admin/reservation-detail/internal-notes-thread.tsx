"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  addInternalNote,
  deleteInternalNote,
} from "@/lib/internal-notes-actions";
import type { InternalNoteEntry } from "@/lib/queries";

interface Props {
  scope: { reservationId?: string; guestId?: string };
  initial: InternalNoteEntry[];
  /** Optional title — defaults to "Journal interne". */
  title?: string;
}

const MAX_LENGTH = 2000;

export function InternalNotesThread({ scope, initial, title }: Props) {
  const [notes, setNotes] = useState(initial);
  const [draft, setDraft] = useState("");
  const [category, setCategory] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    startTransition(async () => {
      try {
        await addInternalNote({
          reservationId: scope.reservationId,
          guestId: scope.guestId,
          body,
          category: category.trim() || undefined,
        });
        setDraft("");
        setCategory("");
        toast.success("Note ajoutée");
        // Optimistic? simpler: rely on server revalidation. The parent
        // page re-fetches via revalidatePath; if you want the note to
        // appear without reload, fetch fresh notes here. We pretend
        // we got back the new note for snappy feedback:
        setNotes((prev) => [
          ...prev,
          {
            id: `temp-${Date.now()}`,
            body,
            category: category.trim() || null,
            createdAt: new Date(),
            author: null,
          },
        ]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur");
      }
    });
  }

  function remove(noteId: string) {
    if (noteId.startsWith("temp-")) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      return;
    }
    startTransition(async () => {
      try {
        await deleteInternalNote({ noteId });
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        toast.success("Note supprimée");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur");
      }
    });
  }

  return (
    <section className="card-admin reservation-card">
      <header className="card-header">
        <h3>{title ?? "Journal interne"}</h3>
        <span className="card-header-meta">
          {notes.length} {notes.length === 1 ? "entrée" : "entrées"}
        </span>
      </header>

      <div className="card-body internal-notes-thread">
        {notes.length === 0 ? (
          <p className="internal-notes-empty">
            Aucune entrée. Ajoutez une note ci-dessous pour conserver le
            contexte interne (allergies, demandes, incidents).
          </p>
        ) : (
          <ul className="internal-notes-list">
            {notes.map((n) => (
              <li key={n.id} className="internal-note-item">
                <header className="internal-note-meta">
                  <span className="internal-note-author">
                    {n.author?.name ?? "—"}
                  </span>
                  <span className="internal-note-date">
                    {new Date(n.createdAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {n.category && (
                    <span className="internal-note-category">{n.category}</span>
                  )}
                  <button
                    type="button"
                    className="internal-note-delete"
                    aria-label="Supprimer la note"
                    onClick={() => remove(n.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </header>
                <p className="internal-note-body">{n.body}</p>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={submit} className="internal-note-form">
          <textarea
            className="textarea-admin"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={MAX_LENGTH}
            rows={3}
            placeholder="Ajouter une entrée…"
            disabled={pending}
          />
          <div className="internal-note-form-foot">
            <input
              type="text"
              className="input-admin internal-note-category-input"
              placeholder="Catégorie (alerte, préférence, incident…)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              maxLength={60}
              disabled={pending}
            />
            <span className="internal-notes-counter">
              {draft.length} / {MAX_LENGTH}
            </span>
            <button
              type="submit"
              className="btn-admin btn-admin-primary btn-admin-sm"
              disabled={pending || !draft.trim()}
            >
              <Plus className="size-3.5" />
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
