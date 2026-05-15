"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, MessageCircle, Star, X } from "lucide-react";
import { toast } from "sonner";
import { moderateReview } from "@/lib/reviews-actions";
import type { ReviewModerationRow } from "@/lib/queries";

type StatusFilter = "PENDING" | "PUBLISHED" | "REJECTED" | "ALL";

interface Props {
  rows: ReviewModerationRow[];
  status: StatusFilter;
}

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "PENDING", label: "En attente" },
  { value: "PUBLISHED", label: "Publiés" },
  { value: "REJECTED", label: "Rejetés" },
  { value: "ALL", label: "Tous" },
];

export function ReviewsModeration({ rows, status }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  function setStatus(next: StatusFilter) {
    const params = new URLSearchParams();
    if (next !== "PENDING") params.set("status", next);
    const qs = params.toString();
    router.push(`/admin/reviews${qs ? `?${qs}` : ""}`);
  }

  function decide(
    reviewId: string,
    decision: "PUBLISH" | "REJECT" | "UNPUBLISH",
  ) {
    setPendingId(reviewId);
    const hostReply = replyDraft[reviewId]?.trim();
    startTransition(async () => {
      try {
        await moderateReview({
          reviewId,
          decision,
          hostReply: hostReply || undefined,
        });
        toast.success(
          decision === "PUBLISH"
            ? "Avis publié"
            : decision === "REJECT"
              ? "Avis rejeté"
              : "Avis retiré de la publication",
        );
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Modération des avis</h1>
          <p>
            Relisez les retours voyageurs avant publication sur la fiche
            publique.
          </p>
        </div>
      </div>

      <div className="tabs-admin">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setStatus(t.value)}
            className={`tab-admin${t.value === status ? " active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="placeholder-card">
          <p>Aucun avis dans cette catégorie.</p>
        </div>
      ) : (
        <div className="reviews-list">
          {rows.map((r) => {
            const isBusy = pendingId === r.id;
            const guestLabel = r.guest
              ? `${r.guest.firstName ?? ""} ${r.guest.lastName ?? ""}`.trim()
              : "Voyageur";
            return (
              <article key={r.id} className="review-card">
                <header className="review-head">
                  <div className="review-meta">
                    <Stars rating={r.rating} />
                    <span className="review-author">
                      {guestLabel}
                      {r.guest?.country ? ` · ${r.guest.country}` : ""}
                    </span>
                    <span className="review-source">{r.source}</span>
                  </div>
                  <div className="review-dates">
                    {r.reservation?.code && (
                      <span className="tag tag-direct">
                        {r.reservation.code}
                      </span>
                    )}
                    <span>
                      {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </header>

                <p className="review-property">
                  {r.property.type === "CHALET" ? "Chalet" : "Bungalow"} ·{" "}
                  <strong>{r.property.name}</strong>
                </p>

                {r.comment ? (
                  <p className="review-comment">{r.comment}</p>
                ) : (
                  <p className="review-comment empty">— Aucun commentaire —</p>
                )}

                {r.hostReply && (
                  <div className="review-host-reply">
                    <MessageCircle className="size-3.5" aria-hidden />
                    <span>{r.hostReply}</span>
                  </div>
                )}

                {r.status === "PENDING" && (
                  <div className="review-reply-editor">
                    <textarea
                      placeholder="Réponse de l'hôte (optionnel) — publiée avec l'avis."
                      value={replyDraft[r.id] ?? ""}
                      onChange={(e) =>
                        setReplyDraft((prev) => ({
                          ...prev,
                          [r.id]: e.target.value,
                        }))
                      }
                      rows={2}
                      maxLength={2000}
                    />
                  </div>
                )}

                <footer className="review-actions">
                  {r.status === "PENDING" ? (
                    <>
                      <button
                        type="button"
                        className="btn-admin btn-admin-primary"
                        disabled={isBusy}
                        onClick={() => decide(r.id, "PUBLISH")}
                      >
                        <Check className="size-3.5" />
                        Publier
                      </button>
                      <button
                        type="button"
                        className="btn-admin btn-admin-ghost"
                        disabled={isBusy}
                        onClick={() => decide(r.id, "REJECT")}
                      >
                        <X className="size-3.5" />
                        Rejeter
                      </button>
                    </>
                  ) : r.status === "PUBLISHED" ? (
                    <button
                      type="button"
                      className="btn-admin btn-admin-ghost"
                      disabled={isBusy}
                      onClick={() => decide(r.id, "UNPUBLISH")}
                    >
                      Dépublier
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-admin btn-admin-ghost"
                      disabled={isBusy}
                      onClick={() => decide(r.id, "PUBLISH")}
                    >
                      Publier quand même
                    </button>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="review-stars" aria-label={`${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((v) => (
        <Star
          key={v}
          className={`size-4 ${v <= rating ? "filled" : ""}`}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}
