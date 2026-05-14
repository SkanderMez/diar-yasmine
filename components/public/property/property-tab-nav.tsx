"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PropertyTabNavProps {
  items: { id: string; label: string }[];
}

/**
 * Maquette `.tab-nav` — sticky below the fixed header. Each link scrolls
 * to its section; an IntersectionObserver tracks which section is most
 * visible and underlines the matching link.
 */
export function PropertyTabNav({ items }: PropertyTabNavProps) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sections = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    /* Use bottom-heavy rootMargin so the section becomes "active" as soon
     * as it sits under the sticky nav, not when the centroid crosses the
     * viewport center. */
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActive(visible[0]!.target.id);
        }
      },
      {
        rootMargin: "-160px 0px -60% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [items]);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 140;
    window.scrollTo({ top, behavior: "smooth" });
    setActive(id);
  }

  return (
    <div className="sticky top-[64px] z-40 border-b border-line-soft bg-ivory/95 backdrop-blur">
      <div className="container-x">
        <nav
          className="scrollbar-hidden flex gap-8 overflow-x-auto py-3"
          aria-label="Sections"
        >
          {items.map((item) => {
            const isActive = active === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                className={cn(
                  "shrink-0 border-b-2 border-transparent py-1 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "text-charcoal-soft hover:text-primary",
                )}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
