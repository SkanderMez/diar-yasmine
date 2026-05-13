import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-medium text-foreground">
          {t("dashboard_title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("dashboard_intro")}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Occupation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium text-foreground">—</p>
            <p className="text-xs text-muted-foreground">Disponible Phase 2</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ADR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium text-foreground">—</p>
            <p className="text-xs text-muted-foreground">Disponible Phase 6</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">RevPAR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium text-foreground">—</p>
            <p className="text-xs text-muted-foreground">Disponible Phase 6</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
