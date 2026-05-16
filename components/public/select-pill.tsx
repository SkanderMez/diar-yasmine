"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectPillOption {
  value: string;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
}

interface SelectPillProps {
  label: string;
  value: string;
  options: SelectPillOption[];
  onChange: (value: string) => void;
  /** Optional leading icon for the trigger row. */
  icon?: React.ReactNode;
  /** Force the menu to a specific minimum width (defaults to trigger width). */
  menuMinWidth?: number;
  /** Optional className for the trigger button. Falls back to `.booking-pill-cell`. */
  className?: string;
  /** Placeholder text when value is empty / matches the first option. */
  placeholder?: string;
}

/**
 * Tokenised replacement for the native `<select>`. Renders the same
 * label + value cell as the booking pill (so the visual stays unified
 * across the public site) and opens a portaled popover anchored to the
 * trigger. The active option gets a check mark; clicking outside or
 * pressing Escape closes the menu.
 */
export function SelectPill({
  label,
  value,
  options,
  onChange,
  icon,
  menuMinWidth,
  className,
  placeholder,
}: SelectPillProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [anchor, setAnchor] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function update() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setAnchor({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
    update();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      const menu = document.getElementById("dy-select-pill-menu");
      if (menu?.contains(t)) return;
      setOpen(false);
    }
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = options.find((o) => o.value === value) ?? options[0];
  const valueLabel = current?.label ?? placeholder ?? "—";
  const isPlaceholder = !value && !!placeholder;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "booking-pill-cell booking-pill-trigger",
          open && "open",
          className,
        )}
      >
        <span className="booking-pill-label">
          {icon ? <span className="mr-1 inline-flex">{icon}</span> : null}
          {label}
        </span>
        <span
          className={cn(
            "booking-pill-value flex items-center justify-between gap-2",
            isPlaceholder && "booking-pill-value-placeholder",
          )}
        >
          <span className="truncate">{valueLabel}</span>
          <ChevronDown
            className={cn(
              "size-3 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </span>
      </button>

      {open &&
        mounted &&
        anchor &&
        createPortal(
          <div
            id="dy-select-pill-menu"
            role="listbox"
            className="fixed z-[100] overflow-hidden rounded-2xl border border-line-soft bg-white py-1.5 shadow-2xl"
            style={{
              top: `${anchor.top}px`,
              left: `${anchor.left}px`,
              minWidth: `${Math.max(menuMinWidth ?? 0, anchor.width)}px`,
            }}
          >
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-primary-tint",
                    active && "bg-primary-tint-strong",
                  )}
                >
                  {option.icon ? (
                    <span
                      className={cn(
                        "inline-flex size-7 shrink-0 items-center justify-center rounded-full",
                        active
                          ? "bg-primary text-ivory"
                          : "bg-sand text-charcoal",
                      )}
                      aria-hidden
                    >
                      {option.icon}
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-medium text-charcoal">
                      {option.label}
                    </span>
                    {option.hint ? (
                      <span className="block text-[11px] text-muted-foreground">
                        {option.hint}
                      </span>
                    ) : null}
                  </span>
                  {active && (
                    <Check
                      className="size-4 shrink-0 text-primary"
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
