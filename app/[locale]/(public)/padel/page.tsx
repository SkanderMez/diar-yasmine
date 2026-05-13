import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Padel",
  description:
    "Padels Méditerranée — 2 terrains de padel professionnels à Tazarka, accessibles depuis Diar Yasmine.",
};

export default async function PadelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex-1 bg-ivory">
      <section className="bg-primary py-20 text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.3em] text-primary-light">
            À deux pas
          </p>
          <h1 className="mt-3 text-4xl font-medium sm:text-5xl">
            Padels Méditerranée
          </h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/85">
            Deux terrains de padel professionnels, adjacents à Diar Yasmine.
            Réservation directe par WhatsApp ou via le site partenaire.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <a
                href="https://padelsmed.com"
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                padelsmed.com <ArrowUpRight className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-5 px-4 py-16 text-foreground/85 sm:px-6">
        <h2 className="text-2xl font-medium text-foreground">
          Les deux terrains
        </h2>
        <p>
          Deux courts de padel en gazon synthétique, vitrés sur les quatre
          côtés, éclairés pour les sessions du soir. Location à l&apos;heure ou
          en pack — initiation, perfectionnement, tournoi.
        </p>

        <h2 className="pt-6 text-2xl font-medium text-foreground">
          Vous séjournez à Diar Yasmine ?
        </h2>
        <p>
          Demandez à la réception un créneau préférentiel. Nous coordonnons avec
          Padels Méditerranée et vous obtenez généralement votre court le jour
          même.
        </p>
      </section>
    </main>
  );
}
