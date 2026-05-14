"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateLanguages } from "@/lib/settings-actions";

type Locale = "fr" | "en" | "ar";

interface SectionLanguagesProps {
  enabled: readonly Locale[];
  /** Completion percent per locale (0-100), rounded. */
  completion: Record<Locale, number>;
}

interface LanguageEntry {
  locale: Locale | "it";
  label: string;
  /** True when this locale is the default and cannot be turned off. */
  always: boolean;
  /** True when the toggle is a placeholder (Italian — not in messages yet). */
  comingSoon: boolean;
  rtl?: boolean;
}

const ENTRIES: readonly LanguageEntry[] = [
  { locale: "fr", label: "🇫🇷 Français", always: true, comingSoon: false },
  { locale: "en", label: "🇬🇧 English", always: false, comingSoon: false },
  {
    locale: "ar",
    label: "العربية Arabic",
    always: false,
    comingSoon: false,
    rtl: true,
  },
  { locale: "it", label: "🇮🇹 Italiano", always: false, comingSoon: true },
];

export function SectionLanguages({
  enabled,
  completion,
}: SectionLanguagesProps) {
  const router = useRouter();
  const [active, setActive] = useState<Set<Locale>>(new Set(enabled));
  const [pending, startTransition] = useTransition();

  function toggle(locale: Locale) {
    const prev = new Set(active);
    if (prev.has(locale)) {
      prev.delete(locale);
    } else {
      prev.add(locale);
    }
    // French is always on; the server enforces this too.
    prev.add("fr");

    // Optimistic UI.
    setActive(prev);
    const ordered: Locale[] = (["fr", "en", "ar"] as const).filter((l) =>
      prev.has(l),
    );

    startTransition(async () => {
      try {
        await updateLanguages({ enabled: ordered });
        toast.success("Langues mises à jour");
        router.refresh();
      } catch (err) {
        // Rollback.
        setActive(new Set(enabled));
        toast.error("Échec de la mise à jour", {
          description: err instanceof Error ? err.message : "Erreur",
        });
      }
    });
  }

  return (
    <div className="small-card">
      <h3>Langues</h3>
      <div className="sub">Site public · système</div>

      {ENTRIES.map((entry) => {
        if (entry.always) {
          return (
            <div key={entry.locale} className="toggle-row">
              <div>
                <div className="label">{entry.label}</div>
                <div className="sub" style={{ margin: 0 }}>
                  Langue par défaut
                </div>
              </div>
              <span className="tag tag-confirmed">Activée</span>
            </div>
          );
        }
        if (entry.comingSoon) {
          return (
            <div key={entry.locale} className="toggle-row">
              <div>
                <div className="label">{entry.label}</div>
                <div className="sub" style={{ margin: 0 }}>
                  À ajouter
                </div>
              </div>
              <button
                type="button"
                className="switch"
                aria-checked={false}
                role="switch"
                aria-label={`Activer ${entry.label}`}
                disabled
              />
            </div>
          );
        }
        const locale = entry.locale as Locale;
        const on = active.has(locale);
        const pct = completion[locale];
        return (
          <div key={locale} className="toggle-row">
            <div>
              <div className="label">{entry.label}</div>
              <div className="sub" style={{ margin: 0 }}>
                {pct}% traduit
                {entry.rtl ? " · RTL" : ""}
              </div>
            </div>
            <button
              type="button"
              className={`switch${on ? " on" : ""}`}
              aria-checked={on}
              role="switch"
              aria-label={`Activer ${entry.label}`}
              onClick={() => toggle(locale)}
              disabled={pending}
            />
          </div>
        );
      })}
    </div>
  );
}
