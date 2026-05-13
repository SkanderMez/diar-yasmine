"use client";

import { Zap } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useQuickBook } from "./provider";
import { QuickBookForm } from "./form";

interface QuickBookSheetProps {
  taxRate: number;
}

export function QuickBookSheet({ taxRate }: QuickBookSheetProps) {
  const { open, closeQuickBook } = useQuickBook();

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) closeQuickBook();
      }}
    >
      <SheetContent
        side="right"
        className="w-full p-0 sm:max-w-[860px] sm:w-[860px]"
      >
        <SheetHeader className="border-b border-border p-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Zap className="size-5 text-primary" />
            Quick Book
          </SheetTitle>
          <SheetDescription>
            Crée une réservation walk-in / téléphone / partenaire en quelques
            secondes. Le tarif se met à jour en direct.
          </SheetDescription>
        </SheetHeader>
        <QuickBookForm taxRate={taxRate} />
      </SheetContent>
    </Sheet>
  );
}
