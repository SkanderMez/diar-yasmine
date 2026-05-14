"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

type Topic = {
  value: string;
  label: string;
};

const TOPICS: ReadonlyArray<Topic> = [
  { value: "reservation", label: "Une réservation" },
  { value: "groupe", label: "Une demande de groupe" },
  { value: "equipements", label: "Question sur les équipements" },
  { value: "padel", label: "Padel" },
  { value: "press", label: "Press" },
  { value: "autre", label: "Autre" },
] as const;

/**
 * Customer contact form. For now it falls back to opening the user's mail
 * client via mailto: — wiring up Resend will come with the email provider
 * task. State is intentionally minimal.
 */
export function ContactForm({ contactEmail }: { contactEmail: string }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState<string>(TOPICS[0]?.value ?? "reservation");
  const [arrival, setArrival] = useState("");
  const [travellers, setTravellers] = useState("");
  const [message, setMessage] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const topicLabel = TOPICS.find((t) => t.value === topic)?.label ?? topic;
    const subject = encodeURIComponent(
      `[Diar Yasmine] ${topicLabel} — ${firstName} ${lastName}`.trim(),
    );
    const lines = [
      `Bonjour,`,
      ``,
      message,
      ``,
      `— ${firstName} ${lastName}`.trim(),
      email,
      phone ? `Téléphone : ${phone}` : null,
      arrival ? `Arrivée souhaitée : ${arrival}` : null,
      travellers ? `Voyageurs : ${travellers}` : null,
      newsletter ? `(Souhaite recevoir la newsletter)` : null,
    ].filter((line): line is string => line !== null);
    const body = encodeURIComponent(lines.join("\n"));
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-md border border-primary/20 bg-primary/5 p-8 text-center">
        <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-5" />
        </span>
        <h3 className="mt-4 font-heading text-2xl text-charcoal">
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
        <Field label="Prénom" htmlFor="contact-first">
          <input
            id="contact-first"
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Sarah"
            className="w-full bg-transparent text-sm text-charcoal outline-none placeholder:text-muted-foreground/60"
          />
        </Field>
        <Field label="Nom" htmlFor="contact-last">
          <input
            id="contact-last"
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Khlif"
            className="w-full bg-transparent text-sm text-charcoal outline-none placeholder:text-muted-foreground/60"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" htmlFor="contact-email">
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sarah@exemple.tn"
            className="w-full bg-transparent text-sm text-charcoal outline-none placeholder:text-muted-foreground/60"
          />
        </Field>
        <Field label="Téléphone" htmlFor="contact-phone">
          <input
            id="contact-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+216 ..."
            className="w-full bg-transparent text-sm text-charcoal outline-none placeholder:text-muted-foreground/60"
          />
        </Field>
      </div>

      <Field label="Sujet" htmlFor="contact-topic">
        <select
          id="contact-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full appearance-none bg-transparent text-sm text-charcoal outline-none"
        >
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date d'arrivée souhaitée" htmlFor="contact-arrival">
          <input
            id="contact-arrival"
            type="text"
            value={arrival}
            onChange={(e) => setArrival(e.target.value)}
            placeholder="14 juin 2026"
            className="w-full bg-transparent text-sm text-charcoal outline-none placeholder:text-muted-foreground/60"
          />
        </Field>
        <Field label="Voyageurs" htmlFor="contact-travellers">
          <input
            id="contact-travellers"
            type="text"
            value={travellers}
            onChange={(e) => setTravellers(e.target.value)}
            placeholder="2 adultes, 1 enfant"
            className="w-full bg-transparent text-sm text-charcoal outline-none placeholder:text-muted-foreground/60"
          />
        </Field>
      </div>

      <Field label="Votre message" htmlFor="contact-message">
        <textarea
          id="contact-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Bonjour, nous serions intéressés par..."
          className="w-full resize-none bg-transparent text-sm text-charcoal outline-none placeholder:text-muted-foreground/60"
        />
      </Field>

      <label className="flex cursor-pointer items-start gap-3 py-1">
        <input
          type="checkbox"
          checked={newsletter}
          onChange={(e) => setNewsletter(e.target.checked)}
          className="mt-0.5 size-[18px] rounded-[4px] border border-line accent-primary"
        />
        <span className="text-sm text-charcoal-soft">
          Je souhaite recevoir les offres saisonnières et nouveautés.
        </span>
      </label>

      <Button
        type="submit"
        size="lg"
        className="h-12 w-full rounded-md text-[15px]"
      >
        Envoyer le message
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        En envoyant ce formulaire, vous acceptez notre politique de
        confidentialité.
      </p>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-xs font-medium tracking-wide text-charcoal-soft"
      >
        {label}
      </label>
      <div className="rounded-md border border-line bg-white px-4 py-3 transition-colors focus-within:border-primary">
        {children}
      </div>
    </div>
  );
}
