"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ActiveProperty } from "@/lib/queries";

/**
 * Quick Book context — holds the open state, the prefill payload, and
 * the cached active-properties list (fetched once in the admin layout).
 *
 * Hotkey: ⌘K / Ctrl+K toggles the modal from anywhere in admin.
 */

export interface QuickBookPrefill {
  propertyId?: string;
  checkInDate?: string;
  checkOutDate?: string;
}

interface QuickBookContextValue {
  open: boolean;
  prefill: QuickBookPrefill;
  properties: ActiveProperty[];
  openQuickBook: (prefill?: QuickBookPrefill) => void;
  closeQuickBook: () => void;
}

const QuickBookContext = createContext<QuickBookContextValue | null>(null);

export function QuickBookProvider({
  children,
  properties,
}: {
  children: React.ReactNode;
  properties: ActiveProperty[];
}) {
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState<QuickBookPrefill>({});

  const openQuickBook = useCallback((nextPrefill?: QuickBookPrefill) => {
    setPrefill(nextPrefill ?? {});
    setOpen(true);
  }, []);
  const closeQuickBook = useCallback(() => {
    setOpen(false);
    setPrefill({});
  }, []);

  useEffect(() => {
    function onKeydown(event: KeyboardEvent) {
      const isMod = event.metaKey || event.ctrlKey;
      if (isMod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
      }
      if (event.key === "Escape" && open) {
        event.preventDefault();
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  }, [open]);

  const value = useMemo<QuickBookContextValue>(
    () => ({ open, prefill, properties, openQuickBook, closeQuickBook }),
    [open, prefill, properties, openQuickBook, closeQuickBook],
  );

  return (
    <QuickBookContext.Provider value={value}>
      {children}
    </QuickBookContext.Provider>
  );
}

export function useQuickBook() {
  const ctx = useContext(QuickBookContext);
  if (!ctx) {
    throw new Error("useQuickBook must be used inside <QuickBookProvider>");
  }
  return ctx;
}
