import Image from "next/image";
import { Car, Check, Heart, MapPin, Plane } from "lucide-react";
import type { ReservationDetail } from "@/lib/queries";
import { formatLocalized } from "@/lib/date";
import { formatTND } from "@/lib/money";

/**
 * A4 voucher paper. Pure presentation, server-rendered.
 *
 * Print-safe by design: every color is a hardcoded hex value and every
 * font is a hardcoded family name — we don't rely on `var(--*)` tokens
 * because the printed sheet must look the same on every browser, with or
 * without admin theme variables loaded. The fonts (Fraunces / Inter /
 * Caveat) are already registered globally via `app/[locale]/layout.tsx`.
 */

interface VoucherPaperProps {
  reservation: ReservationDetail["reservation"];
  voucherNumber: string;
  qrDataUrl: string;
  issuedAt: Date;
  signatureName: string;
}

interface ExtraRow {
  label: string;
  amount: number;
}

const PROPERTY_CATEGORY: Record<"CHALET" | "BUNGALOW", string> = {
  CHALET: "Chalet pieds dans l'eau",
  BUNGALOW: "Bungalow jardin",
};

const CONDITIONS: string[] = [
  "Arrivée à partir de 15h, départ avant 11h. Une arrivée tardive peut être organisée — prévenez la conciergerie au moins 24h à l'avance.",
  "Annulation gratuite jusqu'à 14 jours avant l'arrivée. 50% remboursé entre 7 et 14 jours, non remboursable après.",
  "Ce voucher est nominatif et incessible. Pièce d'identité demandée à l'arrivée.",
  "Le solde dû peut être réglé par carte, espèces ou virement à votre arrivée.",
  "Domaine non-fumeur. Animaux de compagnie non autorisés.",
];

const FONT_DISPLAY = "'Fraunces', Georgia, serif";
const FONT_BODY = "'Inter', sans-serif";
const FONT_SCRIPT = "'Caveat', cursive";

export function VoucherPaper({
  reservation,
  voucherNumber,
  qrDataUrl,
  issuedAt,
  signatureName,
}: VoucherPaperProps) {
  const balance = reservation.total - reservation.paidAmount;
  const extras: ExtraRow[] = Array.isArray(reservation.extras)
    ? (reservation.extras as unknown as ExtraRow[]).filter(
        (e) => typeof e?.label === "string" && typeof e?.amount === "number",
      )
    : [];

  const guestName =
    `${reservation.guest.firstName} ${reservation.guest.lastName}`.trim();
  const travelers = `${reservation.adults} adulte${reservation.adults > 1 ? "s" : ""}${
    reservation.children > 0
      ? `, ${reservation.children} enfant${reservation.children > 1 ? "s" : ""}`
      : ""
  }`;
  const capacity = `${reservation.adults + reservation.children} voyageur${
    reservation.adults + reservation.children > 1 ? "s" : ""
  }`;
  const issuedLabel = formatLocalized(issuedAt, "d MMM yyyy");
  const category = PROPERTY_CATEGORY[reservation.property.type];

  return (
    <div
      className="voucher-page-wrap"
      style={{
        padding: "40px 20px 80px",
        background: "var(--bg-app, #0F1416)",
        backgroundImage:
          "radial-gradient(circle at 25% 25%, rgba(79,184,196,0.04), transparent 50%)",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        className="voucher-page"
        style={{
          width: "100%",
          maxWidth: 794,
          background: "#FAF7F2",
          color: "#1F2A2E",
          borderRadius: 12,
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          overflow: "hidden",
          fontFamily: FONT_BODY,
          position: "relative",
        }}
      >
        {/* Watermark */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "40%",
            right: -120,
            width: 500,
            height: 500,
            backgroundImage: "url('/brand/logo-mark.svg')",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            opacity: 0.04,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div
          className="voucher-content"
          style={{ position: "relative", zIndex: 1, padding: "48px 56px" }}
        >
          {/* Head */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "1px solid #E5DDD0",
              paddingBottom: 28,
              marginBottom: 32,
            }}
          >
            <div>
              <Image
                src="/brand/logo.svg"
                alt="Diar Yasmine"
                width={220}
                height={64}
                priority
                style={{ height: 64, width: "auto" }}
              />
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "#6B7A80",
                }}
              >
                Numéro de voucher
              </div>
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: "1.5rem",
                  color: "#0E5A6B",
                  fontWeight: 500,
                  marginTop: 2,
                }}
              >
                {voucherNumber}
              </div>
              <div
                style={{
                  fontSize: "0.82rem",
                  color: "#6B7A80",
                  marginTop: 2,
                }}
              >
                Émis le {issuedLabel} · Tunis, Tunisie
              </div>
              <div
                style={{
                  width: 92,
                  height: 92,
                  background: "white",
                  border: "1px solid #E5DDD0",
                  borderRadius: 8,
                  marginTop: 12,
                  marginLeft: "auto",
                  padding: 6,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt={`QR de vérification ${reservation.code}`}
                  width={80}
                  height={80}
                  style={{ width: "100%", height: "100%", display: "block" }}
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div
              style={{
                fontFamily: FONT_SCRIPT,
                fontSize: "1.4rem",
                color: "#0E5A6B",
              }}
            >
              Bienvenue chez nous
            </div>
            <h1
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: "2.2rem",
                fontWeight: 400,
                margin: "6px 0 8px",
                letterSpacing: "-0.01em",
                color: "#1F2A2E",
              }}
            >
              Votre{" "}
              <em style={{ fontStyle: "italic", color: "#0E5A6B" }}>
                confirmation de séjour
              </em>
            </h1>
            <p
              style={{
                fontSize: "0.92rem",
                color: "#6B7A80",
                maxWidth: 480,
                margin: "0 auto",
              }}
            >
              Ce document fait office de voucher de réservation. Conservez-le,
              vous en aurez besoin à votre arrivée.
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                margin: "18px auto 0",
                width: "fit-content",
                color: "#4FB8C4",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 64,
                  height: 1,
                  background: "#4FB8C4",
                  opacity: 0.4,
                }}
              />
              <Heart size={16} strokeWidth={1.5} aria-hidden />
              <span
                aria-hidden
                style={{
                  width: 64,
                  height: 1,
                  background: "#4FB8C4",
                  opacity: 0.4,
                }}
              />
            </div>
          </div>

          {/* Stay block */}
          <div
            style={{
              background: "linear-gradient(135deg, #0E5A6B 0%, #4FB8C4 100%)",
              color: "white",
              borderRadius: 8,
              padding: "24px 28px",
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: 28,
              marginBottom: 28,
              boxShadow: "0 4px 12px rgba(14,90,107,0.15)",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  opacity: 0.8,
                }}
              >
                Arrivée
              </div>
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: "1.5rem",
                  fontWeight: 400,
                  marginTop: 4,
                }}
              >
                {formatLocalized(reservation.checkIn, "EEE d MMM")}
              </div>
              <div style={{ fontSize: "0.82rem", opacity: 0.85, marginTop: 2 }}>
                À partir de 15h00
              </div>
            </div>
            <div style={{ textAlign: "center", padding: "0 8px" }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.18)",
                  borderRadius: 999,
                  padding: "6px 14px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                {reservation.nights} nuit{reservation.nights > 1 ? "s" : ""}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  opacity: 0.8,
                }}
              >
                Départ
              </div>
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: "1.5rem",
                  fontWeight: 400,
                  marginTop: 4,
                }}
              >
                {formatLocalized(reservation.checkOut, "EEE d MMM")}
              </div>
              <div style={{ fontSize: "0.82rem", opacity: 0.85, marginTop: 2 }}>
                Avant 11h00
              </div>
            </div>
          </div>

          {/* Info blocks */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
              marginBottom: 28,
            }}
          >
            <InfoBlock title="Voyageur principal">
              <InfoRow label="Nom" value={guestName || "—"} />
              {reservation.guest.email ? (
                <InfoRow label="Email" value={reservation.guest.email} />
              ) : null}
              <InfoRow label="Téléphone" value={reservation.guest.phone} />
              <InfoRow label="Voyageurs" value={travelers} />
              {reservation.guest.country ? (
                <InfoRow
                  label="Pays d'origine"
                  value={reservation.guest.country}
                />
              ) : null}
            </InfoBlock>
            <InfoBlock title="Hébergement">
              <InfoRow label="Catégorie" value={category} />
              <InfoRow label="Nom" value={reservation.property.name} />
              <InfoRow label="Capacité" value={capacity} />
              <InfoRow label="Vue" value="Mer · Front de mer" />
              <InfoRow label="Inclus" value="Pension non incluse" />
            </InfoBlock>
          </div>

          {/* Pricing */}
          <div
            style={{
              marginBottom: 28,
              background: "white",
              border: "1px solid #ECE3D2",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <h4
              style={{
                padding: "14px 18px",
                background: "#F5EFE6",
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#0E5A6B",
                fontWeight: 700,
                borderBottom: "1px solid #ECE3D2",
                margin: 0,
              }}
            >
              Détail tarifaire
            </h4>
            <PriceRow
              label={`${reservation.nights} nuit${reservation.nights > 1 ? "s" : ""}`}
              value={formatTND(reservation.basePrice)}
            />
            {reservation.discountAmount > 0 ? (
              <PriceRow
                label="− Remise"
                value={`−${formatTND(reservation.discountAmount)}`}
                variant="discount"
              />
            ) : null}
            {extras.map((e, i) => (
              <PriceRow key={i} label={e.label} value={formatTND(e.amount)} />
            ))}
            <PriceRow
              label="Sous-total"
              value={formatTND(reservation.subtotal)}
              variant="subtotal"
            />
            {reservation.tax > 0 ? (
              <PriceRow label="TVA" value={formatTND(reservation.tax)} />
            ) : null}
            <PriceRow
              label="Total TTC"
              value={formatTND(reservation.total)}
              variant="total"
            />
          </div>

          {/* Payment */}
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              background: "white",
              border: "1px solid #ECE3D2",
              borderRadius: 8,
              padding: "14px 18px",
              marginBottom: 28,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                background: reservation.paidAmount > 0 ? "#4A8F6B" : "#C49A3D",
                color: "white",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              aria-hidden
            >
              <Check size={20} strokeWidth={2} />
            </div>
            <div style={{ flex: 1 }}>
              <strong
                style={{
                  display: "block",
                  fontSize: "0.95rem",
                  color: "#1F2A2E",
                }}
              >
                {reservation.paidAmount > 0
                  ? `Acompte versé · ${formatTND(reservation.paidAmount)}`
                  : "Aucun acompte versé"}
              </strong>
              <div
                style={{
                  fontSize: "0.82rem",
                  color: "#6B7A80",
                  marginTop: 2,
                }}
              >
                Reçu {reservation.code}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "0.72rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#6B7A80",
                }}
              >
                Solde dû à l&apos;arrivée
              </div>
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: "1.25rem",
                  color: "#0E5A6B",
                }}
              >
                {formatTND(Math.max(balance, 0))}
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div
            style={{
              background: "#F5EFE6",
              borderRadius: 8,
              padding: 20,
              marginBottom: 28,
              fontSize: "0.85rem",
              lineHeight: 1.65,
              color: "#3D4A4F",
            }}
          >
            <h4
              style={{
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#0E5A6B",
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              Conditions de séjour
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {CONDITIONS.map((c, i) => (
                <li key={i} style={{ padding: "3px 0" }}>
                  <span
                    aria-hidden
                    style={{
                      color: "#4FB8C4",
                      marginRight: 8,
                      fontWeight: 700,
                    }}
                  >
                    ·
                  </span>
                  {c}
                </li>
              ))}
            </ul>
          </div>

          {/* Access */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.2fr",
              gap: 20,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                background: "white",
                border: "1px solid #ECE3D2",
                borderRadius: 8,
                padding: 18,
              }}
            >
              <h4
                style={{
                  fontSize: "0.72rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "#0E5A6B",
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                Plan d&apos;accès
              </h4>
              <AccessRow
                icon={<MapPin size={16} strokeWidth={2} aria-hidden />}
                title="Diar Yasmine Tazarka Plage"
                description="Tazarka Plage, Cap Bon, Tunisie"
              />
              <AccessRow
                icon={<Car size={16} strokeWidth={2} aria-hidden />}
                title="En voiture depuis Tunis"
                description="Autoroute A1 sortie Hammamet, puis P1 vers Korba, suivre Tazarka. ~1h."
              />
              <AccessRow
                icon={<Plane size={16} strokeWidth={2} aria-hidden />}
                title="Depuis l'aéroport de Tunis-Carthage"
                description="80 km · 1h15. Transfert organisable avec la conciergerie."
              />
            </div>
            <div
              style={{
                background:
                  "linear-gradient(135deg, #b8d8d4, #4FB8C4 60%, #0E5A6B)",
                borderRadius: 8,
                position: "relative",
                overflow: "hidden",
                minHeight: 180,
              }}
            >
              <svg
                viewBox="0 0 400 300"
                preserveAspectRatio="none"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                }}
                aria-hidden
              >
                <path
                  d="M 0 220 Q 100 200 200 210 T 400 195 L 400 300 L 0 300 Z"
                  fill="rgba(14,90,107,0.25)"
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "55%",
                  transform: "translate(-50%, -50%)",
                  width: 16,
                  height: 16,
                  background: "#C44E7A",
                  border: "3px solid white",
                  borderRadius: "50%",
                  boxShadow: "0 0 0 8px rgba(196,78,122,0.3)",
                }}
                aria-hidden
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(50% - 32px)",
                  left: "55%",
                  transform: "translateX(-50%)",
                  background: "white",
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "#0E5A6B",
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                }}
              >
                {reservation.property.name} · Diar Yasmine
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: 14,
                  color: "white",
                  fontFamily: FONT_SCRIPT,
                  fontSize: "1.05rem",
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                Méditerranée
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              borderTop: "1px solid #E5DDD0",
              paddingTop: 24,
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr",
              gap: 16,
              fontSize: "0.82rem",
              color: "#6B7A80",
            }}
          >
            <div>
              <FooterTitle>Contact 24h/24</FooterTitle>
              <div>
                <strong style={{ color: "#1F2A2E" }}>Conciergerie</strong>
              </div>
              <div>+216 72 000 000</div>
              <div>+216 98 000 000 (WhatsApp)</div>
              <div>contact@diaryasmine.tn</div>
            </div>
            <div>
              <FooterTitle>Services à prévoir</FooterTitle>
              <div>Padel — 60 TND/h</div>
              <div>Room service — 7h–23h</div>
              <div>Ménage quotidien — 80 TND/j</div>
              <div>Location voiture — 120 TND/j</div>
            </div>
            <div>
              <FooterTitle>Signature</FooterTitle>
              <div
                style={{
                  fontFamily: FONT_SCRIPT,
                  fontSize: "1.6rem",
                  color: "#0E5A6B",
                  marginTop: 4,
                }}
              >
                {signatureName}
              </div>
              <div style={{ marginTop: 6 }}>Directeur, Diar Yasmine</div>
              <div>{issuedLabel}</div>
            </div>
          </div>

          {/* Thanks */}
          <div
            style={{
              textAlign: "center",
              fontFamily: FONT_SCRIPT,
              color: "#0E5A6B",
              fontSize: "1.5rem",
              padding: "24px 0 8px",
            }}
          >
            À très bientôt, à Tazarka.
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #ECE3D2",
        borderRadius: 8,
        padding: "16px 18px",
      }}
    >
      <h4
        style={{
          fontSize: "0.7rem",
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          color: "#4FB8C4",
          fontWeight: 700,
          marginBottom: 12,
        }}
      >
        {title}
      </h4>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "5px 0",
        fontSize: "0.88rem",
        gap: 16,
      }}
    >
      <span style={{ color: "#6B7A80" }}>{label}</span>
      <span style={{ fontWeight: 600, color: "#1F2A2E", textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

function PriceRow({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string;
  variant?: "default" | "discount" | "subtotal" | "total";
}) {
  if (variant === "total") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "16px 18px",
          background: "#0E5A6B",
          color: "white",
          alignItems: "center",
        }}
      >
        <span style={{ color: "white", fontWeight: 600, fontSize: "1rem" }}>
          {label}
        </span>
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: "1.6rem",
            fontWeight: 500,
            color: "white",
          }}
        >
          {value}
        </span>
      </div>
    );
  }

  const isDiscount = variant === "discount";
  const isSubtotal = variant === "subtotal";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 18px",
        borderBottom: "1px solid #F5EFE6",
        fontSize: "0.9rem",
        background: isDiscount ? "#f0f9f4" : isSubtotal ? "#FAF7F2" : "white",
        fontWeight: isSubtotal ? 600 : undefined,
      }}
    >
      <span
        style={{
          color: isDiscount ? "#4A8F6B" : "#3D4A4F",
          fontWeight: isDiscount ? 500 : undefined,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "ui-monospace, monospace",
          color: isDiscount ? "#4A8F6B" : "#1F2A2E",
          fontWeight: isDiscount ? 600 : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function AccessRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "6px 0",
        fontSize: "0.85rem",
        alignItems: "flex-start",
      }}
    >
      <span style={{ color: "#0E5A6B", flexShrink: 0, marginTop: 2 }}>
        {icon}
      </span>
      <div>
        <strong style={{ display: "block", color: "#1F2A2E" }}>{title}</strong>
        <span style={{ color: "#6B7A80", fontSize: "0.82rem" }}>
          {description}
        </span>
      </div>
    </div>
  );
}

function FooterTitle({ children }: { children: React.ReactNode }) {
  return (
    <h5
      style={{
        color: "#1F2A2E",
        fontSize: "0.72rem",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        marginBottom: 8,
        fontWeight: 700,
      }}
    >
      {children}
    </h5>
  );
}
