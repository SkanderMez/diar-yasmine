import { Banknote, CreditCard, Landmark } from "lucide-react";

/**
 * Maquette "Étape 3" preview — three dashed tiles teasing the payment
 * methods. Pure visual; the user clicks the step 2 CTA to actually unlock
 * payment.
 */
export function FunnelPaymentPreview() {
  const options: ReadonlyArray<{
    icon: React.ReactNode;
    label: string;
    sub: string;
  }> = [
    {
      icon: <CreditCard className="size-6" />,
      label: "Carte bancaire",
      sub: "Visa, Mastercard",
    },
    {
      icon: <Banknote className="size-6" />,
      label: "Acompte 30 %",
      sub: "Solde à l'arrivée",
    },
    {
      icon: <Landmark className="size-6" />,
      label: "Virement",
      sub: "Sous 24h ouvrées",
    },
  ];

  return (
    <div
      aria-hidden
      className="mt-4 rounded-lg border border-dashed border-line bg-white p-6 opacity-50"
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Étape 3 · Aperçu
      </p>
      <h3 className="mt-1 font-heading text-[1.2rem] text-charcoal">
        Paiement &amp; confirmation
      </h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {options.map((opt) => (
          <div
            key={opt.label}
            className="rounded-md border border-line-soft px-4 py-5 text-center"
          >
            <div className="mb-2 inline-flex text-primary">{opt.icon}</div>
            <p className="text-sm font-medium text-charcoal">{opt.label}</p>
            <p className="mt-0.5 text-[0.78rem] text-muted-foreground">
              {opt.sub}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
