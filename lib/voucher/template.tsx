import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { formatLocalized } from "../date";
import { millimesToTnd } from "../money";

/**
 * Voucher PDF template — A4, brand-coloured, server-rendered on demand.
 *
 * Phase 2: French only. Phase 3 wires EN/AR variants. Print-friendly:
 * @media-print agnostic (PDF is the canonical format; HTML voucher comes
 * in 2.E).
 *
 * Pure stateless function — receives all the data it needs as a prop so
 * the same template can render with seed data, mocks, or real DB rows.
 */

const COLORS = {
  primary: "#006378",
  primaryLight: "#1d98a8",
  ivory: "#faf7f2",
  sand: "#f5efe6",
  charcoal: "#1f2a2e",
  mutedFg: "#6b7472",
  border: "#d8d2c5",
} as const;

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: COLORS.charcoal,
    backgroundColor: COLORS.ivory,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: `1pt solid ${COLORS.border}`,
    paddingBottom: 16,
    marginBottom: 18,
  },
  brand: { flexDirection: "column" },
  brandName: {
    fontSize: 18,
    fontWeight: 600,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 8,
    color: COLORS.mutedFg,
    letterSpacing: 2,
    marginTop: 2,
  },
  codeBlock: { alignItems: "flex-end" },
  codeLabel: { fontSize: 8, color: COLORS.mutedFg, letterSpacing: 1 },
  code: {
    fontFamily: "Courier-Bold",
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 2,
  },
  qr: { width: 72, height: 72, marginTop: 4 },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: COLORS.primary,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: 12,
  },
  stayGrid: { flexDirection: "row", gap: 24 },
  stayCol: { flex: 1 },
  rowLabel: {
    fontSize: 8,
    color: COLORS.mutedFg,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  rowValue: { fontSize: 11, color: COLORS.charcoal, marginTop: 2 },
  table: { marginTop: 4, borderTop: `1pt solid ${COLORS.border}` },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: `0.5pt solid ${COLORS.border}`,
    paddingVertical: 6,
  },
  tableCell: { fontSize: 10 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.primary,
    color: COLORS.ivory,
    padding: 8,
    marginTop: 4,
    borderRadius: 4,
  },
  totalLabel: { fontSize: 12, fontWeight: 700, color: COLORS.ivory },
  totalValue: { fontSize: 14, fontWeight: 700, color: COLORS.ivory },
  conditions: {
    marginTop: 18,
    padding: 12,
    backgroundColor: COLORS.sand,
    borderRadius: 4,
    fontSize: 8,
    color: COLORS.mutedFg,
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: COLORS.mutedFg,
  },
});

export interface VoucherExtra {
  label: string;
  amount: number;
  category?: string;
}

export interface VoucherPayment {
  amount: number;
  method: string;
  receivedAt: Date;
}

export interface VoucherData {
  code: string;
  qrPngDataUrl: string;
  propertyName: string;
  propertyType: "CHALET" | "BUNGALOW";
  checkIn: Date;
  checkOut: Date;
  nights: number;
  adults: number;
  children: number;
  guestFirstName: string;
  guestLastName: string;
  guestPhone: string;
  guestEmail: string | null;
  basePrice: number;
  discountAmount: number;
  extras: VoucherExtra[];
  extrasTotal: number;
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  payments: VoucherPayment[];
  internalNotes?: string | null;
  guestRequests?: string | null;
  termsFr?: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  generatedAt: Date;
}

function fmtTND(millimes: number): string {
  return `${millimesToTnd(millimes).toFixed(3)} TND`;
}

export function VoucherDocument({ data }: { data: VoucherData }) {
  return (
    <Document title={`Voucher ${data.code}`} author="Diar Yasmine">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <Text style={styles.brandName}>DIAR YASMINE</Text>
            <Text style={styles.brandTagline}>TAZARKA PLAGE</Text>
          </View>
          <View style={styles.codeBlock}>
            <Text style={styles.codeLabel}>RÉFÉRENCE</Text>
            <Text style={styles.code}>{data.code}</Text>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={data.qrPngDataUrl} style={styles.qr} />
          </View>
        </View>

        <View style={styles.stayGrid}>
          <View style={styles.stayCol}>
            <Text style={styles.rowLabel}>Hébergement</Text>
            <Text style={styles.rowValue}>
              {data.propertyType === "CHALET" ? "🏖 " : "🌿 "}
              {data.propertyName}
            </Text>

            <Text style={[styles.rowLabel, { marginTop: 12 }]}>Voyageurs</Text>
            <Text style={styles.rowValue}>
              {data.adults} adulte{data.adults > 1 ? "s" : ""}
              {data.children > 0
                ? ` · ${data.children} enfant${data.children > 1 ? "s" : ""}`
                : ""}
            </Text>
          </View>

          <View style={styles.stayCol}>
            <Text style={styles.rowLabel}>Arrivée</Text>
            <Text style={styles.rowValue}>
              {formatLocalized(data.checkIn, "EEEE d MMMM yyyy")}
            </Text>
            <Text style={[styles.rowLabel, { marginTop: 12 }]}>Départ</Text>
            <Text style={styles.rowValue}>
              {formatLocalized(data.checkOut, "EEEE d MMMM yyyy")}
            </Text>
            <Text style={[styles.rowLabel, { marginTop: 12 }]}>Durée</Text>
            <Text style={styles.rowValue}>
              {data.nights} nuit{data.nights > 1 ? "s" : ""}
            </Text>
          </View>

          <View style={styles.stayCol}>
            <Text style={styles.rowLabel}>Client</Text>
            <Text style={styles.rowValue}>
              {data.guestFirstName} {data.guestLastName}
            </Text>
            <Text style={[styles.rowLabel, { marginTop: 12 }]}>Téléphone</Text>
            <Text style={styles.rowValue}>{data.guestPhone}</Text>
            {data.guestEmail ? (
              <>
                <Text style={[styles.rowLabel, { marginTop: 12 }]}>Email</Text>
                <Text style={styles.rowValue}>{data.guestEmail}</Text>
              </>
            ) : null}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Tarif</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>
              {data.nights} nuit{data.nights > 1 ? "s" : ""}
            </Text>
            <Text style={styles.tableCell}>{fmtTND(data.basePrice)}</Text>
          </View>
          {data.discountAmount > 0 ? (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { color: COLORS.primaryLight }]}>
                Remise
              </Text>
              <Text style={[styles.tableCell, { color: COLORS.primaryLight }]}>
                - {fmtTND(data.discountAmount)}
              </Text>
            </View>
          ) : null}
          {data.extras.map((e, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.tableCell}>{e.label}</Text>
              <Text style={styles.tableCell}>{fmtTND(e.amount)}</Text>
            </View>
          ))}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { color: COLORS.mutedFg }]}>
              Sous-total
            </Text>
            <Text style={[styles.tableCell, { color: COLORS.mutedFg }]}>
              {fmtTND(data.subtotal)}
            </Text>
          </View>
          {data.tax > 0 ? (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { color: COLORS.mutedFg }]}>
                TVA
              </Text>
              <Text style={[styles.tableCell, { color: COLORS.mutedFg }]}>
                {fmtTND(data.tax)}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{fmtTND(data.total)}</Text>
        </View>

        {data.payments.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Paiements</Text>
            <View style={styles.table}>
              {data.payments.map((p, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={styles.tableCell}>
                    {p.method} ·{" "}
                    {formatLocalized(p.receivedAt, "d MMM yyyy HH:mm")}
                  </Text>
                  <Text style={styles.tableCell}>{fmtTND(p.amount)}</Text>
                </View>
              ))}
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { fontWeight: 700 }]}>
                  Solde restant
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    { fontWeight: 700, color: COLORS.primary },
                  ]}
                >
                  {fmtTND(data.total - data.paidAmount)}
                </Text>
              </View>
            </View>
          </>
        ) : null}

        {data.guestRequests ? (
          <>
            <Text style={styles.sectionTitle}>Demandes spéciales</Text>
            <Text style={{ fontSize: 9 }}>{data.guestRequests}</Text>
          </>
        ) : null}

        {data.termsFr ? (
          <View style={styles.conditions}>
            <Text>{data.termsFr}</Text>
          </View>
        ) : (
          <View style={styles.conditions}>
            <Text>
              Check-in à partir de 14h00. Check-out avant 11h00. La caution est
              remboursée après inspection du logement, dans un délai de 48 h.
              Toute annulation reçue moins de 7 jours avant l&apos;arrivée
              n&apos;est pas remboursable. Pour toute question, contactez la
              réception.
            </Text>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>
            {data.contactAddress} · {data.contactPhone} · {data.contactEmail}
          </Text>
          <Text>
            Généré le {formatLocalized(data.generatedAt, "d MMM yyyy HH:mm")}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
