import type { ReactNode } from "react";

interface RulesSection {
  title: string;
  icon: ReactNode;
  items: string[];
}

interface PropertyRulesProps {
  sections: RulesSection[];
}

/**
 * Maquette "À savoir" block — 3 stacked sections with an icon header,
 * uppercase title and a bulleted list of items.
 */
export function PropertyRules({ sections }: PropertyRulesProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {sections.map((section) => (
        <div key={section.title}>
          <div className="mb-3 flex items-center gap-2 text-primary">
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-sand text-primary">
              {section.icon}
            </span>
            <h4 className="text-[0.85rem] font-semibold uppercase tracking-[0.12em] text-charcoal">
              {section.title}
            </h4>
          </div>
          <ul className="flex flex-col gap-2 text-sm text-charcoal-soft">
            {section.items.map((item) => (
              <li
                key={item}
                className="flex gap-2 before:mt-2 before:size-1 before:shrink-0 before:rounded-full before:bg-primary/40 before:content-['']"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
