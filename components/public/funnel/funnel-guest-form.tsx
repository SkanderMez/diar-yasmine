"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export interface GuestFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
}

interface FunnelGuestFormProps {
  initialValues?: Partial<GuestFormValues>;
  onSubmit: (values: GuestFormValues) => void;
  /** Hide the standalone submit button (useful when the parent wraps the
   *  form inside its own action footer). When true, the form exposes an
   *  imperative submit via the returned ref-less hidden button. */
  hideSubmit?: boolean;
  submitting?: boolean;
  /** Optional submit label override. */
  submitLabel?: string;
  /** When set, the form id can be referenced by an external submit button. */
  formId?: string;
}

const COUNTRIES: ReadonlyArray<{ code: string; label: string }> = [
  { code: "TN", label: "Tunisie" },
  { code: "FR", label: "France" },
  { code: "DZ", label: "Algérie" },
  { code: "MA", label: "Maroc" },
  { code: "DE", label: "Allemagne" },
  { code: "IT", label: "Italie" },
  { code: "GB", label: "Royaume-Uni" },
  { code: "US", label: "États-Unis" },
  { code: "OTHER", label: "Autre" },
];

/**
 * Maquette "Voyageur principal" section — server-validated on submit but
 * also enforces required fields and email format client-side for instant
 * feedback. Inputs match the `.input` / `.select` maquette styles.
 */
export function FunnelGuestForm({
  initialValues,
  onSubmit,
  hideSubmit,
  submitting,
  submitLabel = "Continuer",
  formId,
}: FunnelGuestFormProps) {
  const [values, setValues] = useState<GuestFormValues>({
    firstName: initialValues?.firstName ?? "",
    lastName: initialValues?.lastName ?? "",
    email: initialValues?.email ?? "",
    phone: initialValues?.phone ?? "",
    country: initialValues?.country ?? "TN",
    city: initialValues?.city ?? "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof GuestFormValues, string>>
  >({});

  function set<K extends keyof GuestFormValues>(
    key: K,
    value: GuestFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof GuestFormValues, string>> = {};
    if (!values.firstName.trim()) next.firstName = "Prénom requis.";
    if (!values.lastName.trim()) next.lastName = "Nom requis.";
    if (!values.phone.trim()) next.phone = "Téléphone requis.";
    if (
      values.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)
    ) {
      next.email = "Format d'email invalide.";
    }
    if (!values.country.trim()) next.country = "Pays requis.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      country: values.country,
      city: values.city.trim(),
    });
  }

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate>
      <h3 className="mb-4 font-sans text-[1.05rem] font-semibold text-charcoal">
        Voyageur principal
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Prénom"
          required
          value={values.firstName}
          onChange={(v) => set("firstName", v)}
          error={errors.firstName}
          autoComplete="given-name"
        />
        <Field
          label="Nom"
          required
          value={values.lastName}
          onChange={(v) => set("lastName", v)}
          error={errors.lastName}
          autoComplete="family-name"
        />
      </div>

      <Field
        label="Email"
        type="email"
        value={values.email}
        onChange={(v) => set("email", v)}
        error={errors.email}
        autoComplete="email"
        hint="Pour le voucher et la confirmation."
      />

      <Field
        label="Téléphone"
        required
        type="tel"
        value={values.phone}
        onChange={(v) => set("phone", v)}
        error={errors.phone}
        autoComplete="tel"
        placeholder="+216 …"
        hint="Numéro avec indicatif international."
      />

      <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
        <SelectField
          label="Pays"
          required
          value={values.country}
          onChange={(v) => set("country", v)}
          error={errors.country}
          options={COUNTRIES.map((c) => ({ value: c.code, label: c.label }))}
        />
        <Field
          label="Ville"
          value={values.city}
          onChange={(v) => set("city", v)}
          error={errors.city}
          autoComplete="address-level2"
        />
      </div>

      {!hideSubmit && (
        <div className="mt-6">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground transition-colors hover:bg-bougainvillier disabled:opacity-50"
          >
            {submitting ? "…" : submitLabel}
          </button>
        </div>
      )}
    </form>
  );
}

function Field({
  label,
  required,
  type = "text",
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
  hint,
}: {
  label: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
      >
        {label}
        {required && <span className="ml-0.5 text-bougainvillier">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error) || undefined}
        className={cn(
          "w-full rounded-md border border-line bg-white px-[18px] py-[14px] text-[0.95rem] text-charcoal outline-none transition-all placeholder:text-muted-foreground/70",
          "focus:border-primary focus:ring-4 focus:ring-turquoise/15",
          error && "border-destructive",
        )}
      />
      {error ? (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function SelectField({
  label,
  required,
  value,
  onChange,
  error,
  options,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  const id = useId();
  return (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
      >
        {label}
        {required && <span className="ml-0.5 text-bougainvillier">*</span>}
      </label>
      <select
        id={id}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error) || undefined}
        className={cn(
          "w-full appearance-none rounded-md border border-line bg-white bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2020%2020%22%20fill=%22none%22%20stroke=%22%236b7a80%22%20stroke-width=%221.6%22><polyline%20points=%225,8%2010,13%2015,8%22/></svg>')] bg-[length:14px] bg-[right_16px_center] bg-no-repeat px-[18px] py-[14px] pr-10 text-[0.95rem] text-charcoal outline-none transition-all",
          "focus:border-primary focus:ring-4 focus:ring-turquoise/15",
          error && "border-destructive",
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
