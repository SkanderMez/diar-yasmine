import { Link } from "@/i18n/navigation";

interface FinalCtaProps {
  photoUrl?: string;
}

/**
 * Closing CTA strip — primary→primary-900 gradient + optional faded
 * background photo at 0.15 opacity. The teaser script + headline +
 * btn-light invite the user toward /book.
 */
export function FinalCta({ photoUrl }: FinalCtaProps) {
  return (
    <section
      className="section-y-lg relative overflow-hidden text-center text-ivory"
      style={{
        background:
          "linear-gradient(135deg, var(--color-primary-raw) 0%, var(--color-primary-900) 100%)",
      }}
    >
      {photoUrl && (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${photoUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.15,
          }}
        />
      )}

      <div className="container-x relative">
        <div className="mb-2 font-script text-2xl text-turquoise-light">
          Votre prochaine évasion
        </div>
        <h2 className="heading-display text-4xl text-ivory sm:text-5xl">
          Réservez en quelques clics
        </h2>
        <p className="mx-auto mb-8 mt-4 max-w-md text-ivory/85">
          Disponibilités en temps réel, paiement sécurisé, voucher instantané.
        </p>
        <Link
          href="/book"
          className="inline-flex items-center justify-center rounded-full bg-white/95 px-9 py-[18px] text-base font-medium text-primary backdrop-blur transition-all hover:-translate-y-px hover:bg-white hover:shadow-md"
        >
          Vérifier les disponibilités
        </Link>
      </div>
    </section>
  );
}
