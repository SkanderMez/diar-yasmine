import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { FadeIn } from "@/components/public/fade-in";

interface BreadcrumbItem {
  href: string;
  label: string;
}

interface ListingPageHeroProps {
  photoUrl?: string | null;
  photoAlt?: string | null;
  breadcrumb: BreadcrumbItem[];
  eyebrowScript: string;
  title: React.ReactNode;
  lead?: string;
}

/**
 * Editorial listing page hero — full-bleed photo + dark gradient bottom,
 * breadcrumb / handwritten eyebrow / display title / optional lead. Sized
 * 56vh (min 420px) to match the maquette so the floating filter bar can
 * overlap by 50px without colliding with content.
 */
export function ListingPageHero({
  photoUrl,
  photoAlt,
  breadcrumb,
  eyebrowScript,
  title,
  lead,
}: ListingPageHeroProps) {
  return (
    <section className="relative flex h-[56vh] min-h-[420px] items-end overflow-hidden pb-12 text-ivory">
      {photoUrl && (
        <Image
          src={photoUrl}
          alt={photoAlt ?? ""}
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
      )}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(14,90,107,0.3) 0%, transparent 40%, rgba(14,90,107,0.7) 100%)",
        }}
      />
      <div className="container-x relative z-[2]">
        <FadeIn className="space-y-3">
          {breadcrumb.length > 0 && (
            <nav
              aria-label="Fil d'Ariane"
              className="flex items-center gap-2 text-[0.85rem] text-ivory/70"
            >
              {breadcrumb.map((item, i) => {
                const isLast = i === breadcrumb.length - 1;
                return (
                  <span
                    key={`${item.href}-${i}`}
                    className="flex items-center gap-2"
                  >
                    {isLast ? (
                      <span>{item.label}</span>
                    ) : (
                      <Link
                        href={item.href}
                        className="transition-colors hover:text-ivory"
                      >
                        {item.label}
                      </Link>
                    )}
                    {!isLast && (
                      <span className="opacity-40" aria-hidden>
                        /
                      </span>
                    )}
                  </span>
                );
              })}
            </nav>
          )}
          <p className="font-script text-2xl font-semibold text-turquoise-light">
            {eyebrowScript}
          </p>
          <h1 className="heading-display text-[clamp(2.5rem,5vw,4.25rem)] font-light text-ivory">
            {title}
          </h1>
          {lead && (
            <p className="max-w-xl text-[1.1rem] text-ivory/90">{lead}</p>
          )}
        </FadeIn>
      </div>
    </section>
  );
}
