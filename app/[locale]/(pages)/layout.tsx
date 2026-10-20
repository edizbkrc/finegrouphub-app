import { setRequestLocale } from "next-intl/server";
import OpsLayout from "@layout/OpsLayout";
import type { AppLocale } from "@/i18n/routing";

/**
 * Korumalı route grubu. Oturum kontrolü middleware'de yapılır; burada yalnızca
 * kabuk (AppBar + Drawer + içerik) sarılır.
 */
export default async function PagesLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <OpsLayout>{children}</OpsLayout>;
}
