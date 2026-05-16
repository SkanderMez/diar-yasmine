"use client";

import { useState, useTransition } from "react";
import { Check, Star } from "lucide-react";
import { toast } from "sonner";
import { submitReview } from "@/lib/reviews-actions";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  code: string;
  locale: string;
}

export function ReviewForm({ code, locale }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Sélectionnez une note de 1 à 5 étoiles");
      return;
    }
    startTransition(async () => {
      try {
        await submitReview({
          code,
          rating,
          comment: comment.trim() || undefined,
          locale: (locale === "en" || locale === "ar" ? locale : "fr") as
            | "fr"
            | "en"
            | "ar",
        });
        setSubmitted(true);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur");
      }
    });
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-line bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check className="size-6" />
        </div>
        <h2 className="font-heading text-2xl text-charcoal">Merci&nbsp;!</h2>
        <p className="mt-2 text-muted-foreground">
          Votre avis a bien été reçu. Notre équipe le relit avant publication
          sur la fiche.
        </p>
      </div>
    );
  }

  const display = hover || rating;

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-line bg-card p-8 shadow-sm"
    >
      <fieldset>
        <legend className="block text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Note globale
        </legend>
        <div className="mt-3 flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              onMouseEnter={() => setHover(v)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(v)}
              aria-label={`${v} étoile${v > 1 ? "s" : ""}`}
              className="inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-primary-tint"
            >
              <Star
                className={cn(
                  "size-7 transition-colors",
                  display >= v
                    ? "fill-gold text-gold"
                    : "fill-transparent text-line",
                )}
                strokeWidth={1.5}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            {display ? `${display} / 5` : "Choisissez une note"}
          </span>
        </div>
      </fieldset>

      <div className="mt-7">
        <label
          htmlFor="comment"
          className="block text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground"
        >
          Votre commentaire
          <span className="ml-2 text-[0.7rem] font-normal normal-case tracking-normal text-muted-foreground/70">
            (optionnel)
          </span>
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          rows={6}
          placeholder="Ce qui vous a plu, ce qui mériterait d'être amélioré…"
          className="mt-3 block w-full rounded-lg border border-line bg-card p-4 text-[0.95rem] text-charcoal outline-none transition-colors focus:border-primary"
        />
        <div className="mt-1 text-right text-xs text-muted-foreground">
          {comment.length} / 2000
        </div>
      </div>

      <div className="mt-7 flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={pending || rating < 1}
          className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-bougainvillier hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Envoi…" : "Envoyer mon avis"}
        </button>
      </div>
    </form>
  );
}
