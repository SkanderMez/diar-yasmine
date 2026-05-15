import { getTranslations } from "next-intl/server";
import { HeaderShell } from "./header-shell";

/**
 * Public navigation order — matches the maquette nav exactly.
 * The "experiences" entry currently points at /padel; we'll move the
 * route to /experiences when the page itself is rebuilt in Phase B6.
 */
const NAV_ITEMS = [
  { key: "home" as const, href: "/" },
  { key: "chalets" as const, href: "/chalets" },
  { key: "bungalows" as const, href: "/bungalows" },
  { key: "experiences" as const, href: "/padel" },
  { key: "about" as const, href: "/about" },
  { key: "contact" as const, href: "/contact" },
];

export async function Header() {
  const t = await getTranslations("nav");
  const items = NAV_ITEMS.map((item) => ({
    key: item.key,
    href: item.href,
    label: t(item.key),
  }));
  const contactPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  return (
    <HeaderShell
      items={items}
      cta={t("book_cta")}
      contactPhone={contactPhone}
    />
  );
}
