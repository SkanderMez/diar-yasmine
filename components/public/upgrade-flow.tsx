"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2, ShieldCheck } from "lucide-react";

type Step = "phone" | "verify";

/**
 * Two-step account upgrade flow.
 *
 * Step 1 — phone: hit /api/auth/customer/request-otp. The endpoint is
 * enumeration-safe (always returns ok) so the UI advances regardless.
 * Step 2 — verify: code + chosen password. Server validates the OTP,
 * sets the password, opens the customer session, and we redirect to
 * /account on success.
 */
export function UpgradeFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/auth/customer/request-otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    setSubmitting(false);
    if (res.status === 429) {
      setError("Trop de demandes. Réessayez dans une heure.");
      return;
    }
    if (!res.ok) {
      setError("Numéro invalide.");
      return;
    }
    setStep("verify");
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/auth/customer/verify-otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, code, password }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data: { error?: string } = await res.json().catch(() => ({}));
      setError(errorLabel(data.error));
      return;
    }
    router.push("/account");
    router.refresh();
  }

  if (step === "phone") {
    return (
      <form onSubmit={requestOtp} className="space-y-5">
        <p className="flex items-start gap-2 rounded-md bg-sand/60 p-3 text-xs text-charcoal-soft">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          Vous recevrez un code à 6 chiffres sur ce numéro pour vérifier que
          vous êtes bien le ou la même personne.
        </p>

        <Field label="Téléphone" htmlFor="upgrade-phone">
          <input
            id="upgrade-phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+216 98 000 000"
            autoComplete="tel"
            className="w-full bg-transparent text-sm text-charcoal outline-none placeholder:text-muted-foreground/60"
          />
        </Field>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="size-4" /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-ivory transition-all hover:-translate-y-px hover:bg-bougainvillier hover:shadow-md disabled:opacity-50"
        >
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Recevoir le code
          <ArrowRight className="size-4" />
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={verifyOtp} className="space-y-5">
      <p className="text-sm text-charcoal-soft">
        Code envoyé à <strong className="text-charcoal">{phone}</strong>.{" "}
        <button
          type="button"
          onClick={() => setStep("phone")}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Modifier
        </button>
      </p>

      <Field label="Code à 6 chiffres" htmlFor="upgrade-code">
        <input
          id="upgrade-code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          pattern="[0-9]{6}"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="w-full bg-transparent text-center font-heading text-2xl font-medium tracking-[0.5em] text-charcoal outline-none"
        />
      </Field>

      <Field label="Nouveau mot de passe" htmlFor="upgrade-password">
        <input
          id="upgrade-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="8 caractères minimum"
          className="w-full bg-transparent text-sm text-charcoal outline-none placeholder:text-muted-foreground/60"
        />
      </Field>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="size-4" /> {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-ivory transition-all hover:-translate-y-px hover:bg-bougainvillier hover:shadow-md disabled:opacity-50"
      >
        {submitting && <Loader2 className="size-4 animate-spin" />}
        Valider et créer mon compte
      </button>
    </form>
  );
}

function errorLabel(code: string | undefined): string {
  switch (code) {
    case "expired":
      return "Code expiré. Demandez-en un nouveau.";
    case "bad_code":
      return "Code incorrect.";
    case "too_many":
      return "Trop de tentatives. Demandez un nouveau code.";
    case "no_guest":
      return "Aucun compte trouvé pour ce numéro.";
    default:
      return "Une erreur est survenue.";
  }
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-line bg-white px-4 py-3 transition-colors focus-within:border-primary focus-within:ring-4 focus-within:ring-turquoise/15">
      <label
        htmlFor={htmlFor}
        className="block text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
      >
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
