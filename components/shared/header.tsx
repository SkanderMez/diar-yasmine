import { getTranslations } from "next-intl/server";
import { HeaderShell } from "./header-shell";

const NAV_ITEMS = [
  { key: "chalets" as const, href: "/chalets" },
  { key: "bungalows" as const, href: "/bungalows" },
  { key: "padel" as const, href: "/padel" },
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
