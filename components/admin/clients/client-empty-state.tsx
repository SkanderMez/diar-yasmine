import { Users } from "lucide-react";

/**
 * Right-pane placeholder shown when no client is selected via `?id=`.
 * Mirrors the visual rhythm of the populated detail card so the layout
 * doesn't jump when the user picks a row.
 */
export function ClientEmptyState() {
  return (
    <div className="client-detail-empty">
      <Users className="size-12" strokeWidth={1.25} aria-hidden />
      <h3>Sélectionnez un client</h3>
      <p>
        Choisissez un client dans la liste à gauche pour voir son profil, son
        historique de séjours, ses préférences et ses documents.
      </p>
    </div>
  );
}
