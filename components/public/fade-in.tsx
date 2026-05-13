"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface FadeInProps {
  children: React.ReactNode;
  /** Tailwind transition-delay class, e.g. "delay-100" / "delay-200". */
  delay?: string;
  /** Initial vertical offset before reveal. Default: "y-6" (24px). */
  offset?: "y-2" | "y-4" | "y-6" | "y-10";
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

/**
 * Scroll-triggered fade-in-up. Pure CSS transitions + IntersectionObserver
 * — zero animation library cost. Honours prefers-reduced-motion via the
 * global rule in globals.css.
 */
export function FadeIn({
  children,
  delay,
  offset = "y-6",
  className,
  as: Tag = "div",
}: FadeInProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const offsetClass = {
    "y-2": "translate-y-2",
    "y-4": "translate-y-4",
    "y-6": "translate-y-6",
    "y-10": "translate-y-10",
  }[offset];

  const Component = Tag as "div";

  return (
    <Component
      ref={ref as never}
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-y-0" : `opacity-0 ${offsetClass}`,
        delay,
        className,
      )}
    >
      {children}
    </Component>
  );
}
