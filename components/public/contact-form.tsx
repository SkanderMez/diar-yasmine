"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Client-side contact form. For now it falls back to opening the user's
 * mail client via mailto: — wiring up Resend will come with the email
 * provider task. State is intentionally minimal.
 */
export function ContactForm({ contactEmail }: { contactEmail: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("reservation");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(
      `[Diar Yasmine] ${TOPICS.find((t) => t.value === topic)?.label} — ${name}`,
    );
    const body = encodeURIComponent(
      `Bonjour,\n\n${message}\n\n— ${name}\n${email}`,
    );
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-3xl border border-primary/20 bg-primary/5 p-8 text-center">
        <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-5" />
        </span>
        <h3 className="mt-4 font-heading text-2xl text-foreground">
          Votre client mail s&apos;est ouvert
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Si ce n&apos;est pas le cas, écrivez-nous à{" "}
          <a
            href={`mailto:${contactEmail}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {contactEmail}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Votre nom">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sarah Khalil"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sarah@email.com"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
          />
        </Field>
      </div>

      <Field label="Sujet">
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full appearance-none bg-transparent text-sm outline-none"
        >
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Message">
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Bonjour, nous souhaitons réserver un chalet du 12 au 19 juillet…"
          className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <p className="text-xs text-muted-foreground">
          Réponse sous 24h. Vos données restent chez nous.
        </p>
        <Button type="submit" shape="pill" size="lg" className="gap-2">
          Envoyer
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </form>
  );
}

const TOPICS = [
  { value: "reservation", label: "Une réservation" },
  { value: "groupe", label: "Un séjour de groupe" },
  { value: "padel", label: "Le padel" },
  { value: "autre", label: "Autre demande" },
];

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
