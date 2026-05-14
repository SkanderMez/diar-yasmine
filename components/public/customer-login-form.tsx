"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CustomerLoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    router.push("/account");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Téléphone ou email">
        <input
          type="text"
          required
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="+216 …"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
        />
      </Field>
      <Field label="Mot de passe">
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-transparent text-sm outline-none"
        />
      </Field>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="size-4" /> {error}
        </div>
      )}

      <Button
        type="submit"
        shape="pill"
        size="lg"
        disabled={submitting}
        className="w-full gap-2"
      >
        {submitting && <Loader2 className="size-4 animate-spin" />}
        Se connecter
      </Button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block cursor-text rounded-2xl border border-border bg-bone/40 px-4 py-3 transition-colors focus-within:border-primary focus-within:bg-card">
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
