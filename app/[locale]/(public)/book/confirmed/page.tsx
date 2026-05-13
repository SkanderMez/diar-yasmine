import { CheckCircle2, Mail, Phone } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { isValidReservationCode } from "@/lib/code";

export default async function BookConfirmedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { code } = await searchParams;
  const validCode = code && isValidReservationCode(code) ? code : null;

  return (
    <main className="flex flex-1 items-center justify-center bg-sand py-24">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <div className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-8" />
        </div>
        <h1 className="mt-6 text-4xl font-medium text-foreground">
          Réservation confirmée
        </h1>
        {validCode ? (
          <p className="mt-4 font-mono text-lg text-primary">{validCode}</p>
        ) : null}
        <p className="mt-4 text-muted-foreground">
          Merci ! Votre demande de réservation est enregistrée. Notre équipe
          vous contacte sous peu pour finaliser le paiement et envoyer le
          voucher.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
          <Button asChild variant="outline">
            <a
              href={`mailto:contact@diaryasmine.tn?subject=Réservation%20${validCode ?? ""}`}
            >
              <Mail className="mr-2 size-4" /> Nous contacter
            </a>
          </Button>
          <Button asChild variant="ghost">
            <a href={`tel:+216`}>
              <Phone className="mr-2 size-4" /> Appeler la réception
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}
