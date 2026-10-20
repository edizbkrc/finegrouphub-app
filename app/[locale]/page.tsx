import { setRequestLocale } from "next-intl/server";
import LoginScreen from "@components/Login/LoginScreen";
import type { AppLocale } from "@/i18n/routing";

/** Login ekranı (public). Middleware oturum varsa buradan dashboard'a yönlendirir. */
export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LoginScreen />;
}
