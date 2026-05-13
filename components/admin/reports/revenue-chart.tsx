"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parse } from "date-fns";
import { fr } from "date-fns/locale";
import type { ReservationSource } from "@prisma/client";
import { millimesToTnd } from "@/lib/money";

interface MonthlyPoint {
  month: string; // YYYY-MM
  occupiedNights: number;
  availableNights: number;
  revenue: number;
  occupancyRate: number;
  adr: number;
  revpar: number;
}

const SOURCE_COLOR: Record<ReservationSource, string> = {
  DIRECT_WEB: "#006378",
  WALK_IN: "#7A8F6B",
  PHONE: "#7A8F6B",
  PARTNER: "#7C3AED",
  BOOKING: "#1E3A8A",
  AIRBNB: "#E11D48",
  EXPEDIA: "#E0A458",
  OTHER: "#6B7280",
};

const SOURCE_LABEL: Record<ReservationSource, string> = {
  DIRECT_WEB: "Site direct",
  WALK_IN: "Walk-in",
  PHONE: "Téléphone",
  PARTNER: "Partenaire",
  BOOKING: "Booking",
  AIRBNB: "Airbnb",
  EXPEDIA: "Expedia",
  OTHER: "Autre",
};

function monthLabel(key: string): string {
  return format(parse(key, "yyyy-MM", new Date()), "MMM yy", { locale: fr });
}

export function RevenueByMonthChart({ data }: { data: MonthlyPoint[] }) {
  const points = data.map((d) => ({
    month: monthLabel(d.month),
    revenueTnd: Number(millimesToTnd(d.revenue).toFixed(0)),
    occ: Math.round(d.occupancyRate * 100),
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={points} margin={{ top: 12, left: 0, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(31,42,46,0.1)" />
          <XAxis dataKey="month" stroke="#6b7472" fontSize={11} />
          <YAxis
            stroke="#6b7472"
            fontSize={11}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)} k` : v.toString()
            }
          />
          <Tooltip
            cursor={{ fill: "rgba(0,99,120,0.06)" }}
            contentStyle={{
              background: "#faf7f2",
              border: "1px solid rgba(31,42,46,0.1)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value, name) => {
              const num = Number(value ?? 0);
              return name === "revenueTnd"
                ? [`${num.toLocaleString("fr-TN")} TND`, "Revenu"]
                : [`${num}%`, "Occupation"];
            }}
          />
          <Bar dataKey="revenueTnd" fill="#006378" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SourceMixChart({
  data,
}: {
  data: { source: ReservationSource; revenue: number; nights: number }[];
}) {
  const points = data
    .filter((d) => d.revenue > 0)
    .map((d) => ({
      name: SOURCE_LABEL[d.source],
      value: Number(millimesToTnd(d.revenue).toFixed(0)),
      fill: SOURCE_COLOR[d.source],
    }));

  if (points.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Pas encore de revenu sur cette période.
      </p>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={points}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
          >
            {points.map((p, i) => (
              <Cell key={i} fill={p.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#faf7f2",
              border: "1px solid rgba(31,42,46,0.1)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value, name) => [
              `${Number(value ?? 0).toLocaleString("fr-TN")} TND`,
              String(name),
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
