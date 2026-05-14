"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addPayment } from "@/lib/reservations";
import { tndToMillimes } from "@/lib/money";

interface AddPaymentDialogProps {
  reservationId: string;
  remainingBalance: number; // millimes
}

const METHODS = [
  { value: "CASH", label: "Espèces" },
  { value: "CARD", label: "Carte (manuel)" },
  { value: "TRANSFER", label: "Virement" },
  { value: "FLOUCI", label: "Flouci" },
  { value: "OTHER", label: "Autre" },
] as const;

export function AddPaymentDialog({
  reservationId,
  remainingBalance,
}: AddPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [method, setMethod] =
    useState<(typeof METHODS)[number]["value"]>("CASH");
  const [reference, setReference] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Montant invalide");
      return;
    }
    const millimes = tndToMillimes(parsed);
    if (millimes > remainingBalance) {
      toast.error("Le montant dépasse le solde restant");
      return;
    }
    startTransition(async () => {
      try {
        await addPayment({
          reservationId,
          amount: millimes,
          method,
          reference: reference || undefined,
        });
        toast.success("Paiement enregistré");
        setAmount("");
        setReference("");
        setOpen(false);
      } catch (err) {
        toast.error("Échec de l'enregistrement", {
          description: err instanceof Error ? err.message : "Erreur",
        });
      }
    });
  }

  if (remainingBalance <= 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="btn-admin btn-admin-primary btn-admin-sm"
        >
          <Plus className="size-3.5" aria-hidden />
          Ajouter paiement
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Montant (TND)</Label>
            <Input
              id="amount"
              type="number"
              step="0.001"
              min="0"
              max={remainingBalance / 1000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Solde restant : {(remainingBalance / 1000).toFixed(3)} TND
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="method">Méthode</Label>
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as typeof method)}
            >
              <SelectTrigger id="method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference">
              Référence{" "}
              <span className="text-muted-foreground">(facultatif)</span>
            </Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Reçu n°, transaction…"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
