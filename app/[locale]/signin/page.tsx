import { getTranslations, setRequestLocale } from "next-intl/server";
import { signIn } from "@/auth";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { error, callbackUrl } = await searchParams;
  const t = await getTranslations("admin");

  const target = callbackUrl ?? `/${locale}/admin/dashboard`;

  async function authenticate(formData: FormData) {
    "use server";
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: target,
    });
  }

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-sand px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("signin_title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={authenticate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("signin_email_label")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("signin_password_label")}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {t("signin_error")}
                </p>
              )}
              <Button type="submit" className="w-full">
                {t("signin_submit")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
