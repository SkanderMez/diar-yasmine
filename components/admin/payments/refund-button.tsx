"use client";

import { useState, useTransition } from "react";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { refundPayment } from "@/lib/reservations";

interface RefundButtonProps {
  paymentId: string;
  amountLabel: string;
}

export function RefundButton({ paymentId, amountLabel }: RefundButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function confirm(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await refundPayment({ paymentId, reason: reason || undefined });
        toast.success("Remboursement enregistré");
        setReason("");
        setOpen(false);
      } catch (err) {
        toast.error("Échec du remboursement", {
          description: err instanceof Error ? err.message : "Erreur",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="xs" variant="ghost" className="gap-1">
          <Undo2 className="size-3.5" />
          Rembourser
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rembourser le paiement</DialogTitle>
          <DialogDescription>
            Le solde de la réservation sera ajusté. L&apos;action est tracée
            dans le journal d&apos;audit.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={confirm} className="space-y-4">
          <p className="text-sm">
            Montant à rembourser : <strong>{amountLabel}</strong>
          </p>
          <div className="space-y-2">
            <Label htmlFor="reason">
              Motif <span className="text-muted-foreground">(facultatif)</span>
            </Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Annulation, erreur d'encaissement, etc."
              maxLength={400}
            />
          </div>
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "En cours…" : "Confirmer le remboursement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
