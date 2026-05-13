"use client";

import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuickBook } from "./provider";

/**
 * Quick Book trigger in the admin Topbar. Wired to the same modal as the
 * ⌘K hotkey; clicking it just calls openQuickBook().
 */
export function QuickBookTriggerButton() {
  const { openQuickBook } = useQuickBook();
  return (
    <Button size="sm" className="gap-2" onClick={() => openQuickBook()}>
      <Zap className="size-4" />
      <span className="hidden md:inline">Quick Book</span>
      <kbd className="ml-1 hidden rounded bg-primary-foreground/10 px-1.5 py-0.5 text-[10px] font-medium md:inline">
        ⌘K
      </kbd>
    </Button>
  );
}
