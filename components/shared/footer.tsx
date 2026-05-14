import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * Public footer — pixel match of the maquette `partials.js` FOOTER.
 *
 * Layout: 4-column grid (1.4fr / 1fr / 1fr / 1.2fr) on a primary-900
 * background. Brand block / Découvrir / Pratique / Newsletter+contact.
 * Newsletter input is a pill on a translucent white background; the
 * "S'abonner" button uses the accent turquoise on primary-900.
 */
export async function Footer() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const email =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@diaryasmine.tn";
  const phone = process.env.NEXT_PUBLIC_RECEPTION_PHONE ?? "+216 72 000 000";
  const year = new Date().getFullYear();

  const discover = [
    { key: "chalets" as const, href: "/chalets" },
    { key: "bungalows" as const, href: "/bungalows" },
    { key: "experiences" as const, href: "/padel" },
    { key: "about" as const, href: "/about" },
  ];
  const practical = [
    { label: "Contact", href: "/contact" },
    { label: "Comment venir", href: "/contact#venir" },
    { label: "Conditions générales", href: "/cgv" },
    { label: "Politique de confidentialité", href: "/privacy" },
    { label: "FAQ", href: "/faq" },
  ];

  return (
    <footer className="bg-[var(--color-primary-900)] text-[rgba(245,239,230,0.85)]">
      <div className="container-x pt-20 pb-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* Brand block */}
          <div>
            <Image
              src="/brand/logo-white.svg"
              alt="Diar Yasmine"
              width={200}
              height={80}
              className="mb-4 h-16 w-auto"
            />
            <p className="max-w-xs text-[rgba(245,239,230,0.7)]">
              {t("tagline")}
            </p>
            <div className="mt-6 flex gap-3">
              <SocialLink
                href="https://www.instagram.com/diaryasmine"
                label="Instagram"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </SocialLink>
              <SocialLink
                href="https://www.facebook.com/diaryasmine"
                label="Facebook"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </SocialLink>
              {whatsapp && (
                <SocialLink
                  href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
                  label="WhatsApp"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.5 14.5c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1-1.5-.8-2.5-1.4-3.5-3.1-.3-.5.3-.4.8-1.4.1-.2.1-.3 0-.5s-.7-1.7-.9-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3 4.8 4.2 1.8.7 2.5.8 3.4.7.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.2-.2-.4-.2-.6-.4zM12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.3-1.6c1.7 1 3.7 1.5 5.7 1.5 6.6 0 12-5.4 12-12S18.6 0 12 0z" />
                  </svg>
                </SocialLink>
              )}
            </div>
          </div>

          {/* Découvrir */}
          <div>
            <h5 className="mb-5 text-xs font-medium uppercase tracking-[0.2em] text-turquoise">
              Découvrir
            </h5>
            <ul className="flex flex-col gap-3 text-sm">
              {discover.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-turquoise"
                  >
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Pratique */}
          <div>
            <h5 className="mb-5 text-xs font-medium uppercase tracking-[0.2em] text-turquoise">
              Pratique
            </h5>
            <ul className="flex flex-col gap-3 text-sm">
              {practical.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-turquoise"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter + contact */}
          <div>
            <h5 className="mb-5 text-xs font-medium uppercase tracking-[0.2em] text-turquoise">
              Restez en contact
            </h5>
            <p className="mb-4 text-sm text-[rgba(245,239,230,0.7)]">
              Recevez nos offres saisonnières et nouveautés.
            </p>
            <form className="flex flex-col gap-3">
              <input
                type="email"
                required
                placeholder="Votre email"
                aria-label="Email pour newsletter"
                className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm text-ivory outline-none transition-colors placeholder:text-[rgba(245,239,230,0.5)] focus:border-turquoise focus:bg-white/10"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-turquoise px-5 py-3 text-sm font-medium text-[var(--color-primary-900)] transition-colors hover:bg-turquoise-light"
              >
                S&apos;abonner
              </button>
            </form>

            <div className="mt-7 space-y-1.5 text-sm leading-relaxed text-[rgba(245,239,230,0.7)]">
              <div>{t("address_line")}</div>
              <div>
                <a
                  href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                  className="transition-colors hover:text-turquoise"
                >
                  {phone}
                </a>
              </div>
              <div>
                <a
                  href={`mailto:${email}`}
                  className="transition-colors hover:text-turquoise"
                >
                  {email}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-baseline justify-between gap-3 border-t border-white/[0.08] pt-6 text-xs text-[rgba(245,239,230,0.55)]">
          <div>
            © {year} Diar Yasmine Tazarka Plage. {t("rights")}
          </div>
          <div>Conçu avec soin entre mer et jardin.</div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex size-9 items-center justify-center rounded-full border border-white/15 transition-all hover:border-turquoise hover:bg-turquoise hover:text-[var(--color-primary-900)]"
    >
      {children}
    </a>
  );
}
