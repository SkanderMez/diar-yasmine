import type { ReviewStatus } from "@prisma/client";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

interface Props {
  propertyName: string;
  propertyType: "CHALET" | "BUNGALOW";
  status: ReviewStatus;
}

export function ReviewAlreadySubmitted({
  propertyName,
  propertyType,
  status,
}: Props) {
  const isPublished = status === "PUBLISHED";
  const isRejected = status === "REJECTED";

  const Icon = isPublished ? CheckCircle2 : isRejected ? XCircle : Clock;
  const tint = isRejected
    ? "bg-rose-500/10 text-rose-500"
    : isPublished
      ? "bg-emerald-500/10 text-emerald-600"
      : "bg-amber-500/10 text-amber-600";

  return (
    <main className="flex-1 bg-ivory text-foreground">
      <section className="section-y-lg">
        <div className="container-x max-w-2xl text-center">
          <p className="mb-2 font-script text-2xl text-turquoise">
            {propertyName}
          </p>
          <h1 className="heading-display text-3xl text-charcoal sm:text-4xl">
            Avis déjà déposé
          </h1>
          <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 shadow-sm">
            <span
              className={`inline-flex size-7 items-center justify-center rounded-full ${tint}`}
            >
              <Icon className="size-4" />
            </span>
            <span className="text-sm text-charcoal">
              {isPublished
                ? "Votre avis est publié sur la fiche du séjour."
                : isRejected
                  ? "Votre avis n'a pas été retenu."
                  : "Votre avis est en cours de modération."}
            </span>
          </div>
          <p className="mx-auto mt-5 max-w-md text-muted-foreground">
            Merci pour le temps consacré à votre retour sur le{" "}
            {propertyType === "CHALET" ? "chalet" : "bungalow"}.
          </p>
        </div>
      </section>
    </main>
  );
}
