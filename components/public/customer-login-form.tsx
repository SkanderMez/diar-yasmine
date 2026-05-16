"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";

/**
 * Customer login form — phone OR email + password. POSTs to the existing
 * /api/auth/customer/login endpoint. On success, redirects to `?next=...`
 * if it points at a same-origin path (e.g. coming from the funnel), else
 * /account.
 */
export function CustomerLoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function resolveNext(): string {
    const raw = sp?.get("next");
    if (!raw) return "/account";
    // Only allow internal redirects (start with "/", reject "//" + protocol).
    if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
    return "/account";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/auth/customer/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Identifiants incorrects.");
      return;
    }
    router.push(resolveNext());
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Téléphone ou email" htmlFor="login-identifier">
        <input
          id="login-identifier"
          type="text"
          required
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="+216 98 000 000 ou vous@email.com"
          className="w-full bg-transparent text-sm text-charcoal outline-none placeholder:text-muted-foreground/60"
        />
      </Field>

      <Field label="Mot de passe" htmlFor="login-password">
        <input
          id="login-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-transparent text-sm text-charcoal outline-none"
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
        Se connecter
      </button>
    </form>
  );
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
