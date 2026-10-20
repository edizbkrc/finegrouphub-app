import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { decrypt } from "./app/lib/session";
import { Routes } from "@enums/Routes";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

/** Oturum gerektirmeyen yollar. */
const PUBLIC_PATHS = ["/", "/tr", "/en"];

/** Oturum gerektirmeyen önekler (public teklif önizlemesi). */
const PUBLIC_PREFIXES = ["/offer-preview"];

const LOCALE_PATTERN = /^\/(tr|en)(\/|$)/;

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;

  // /offer-preview/... ve /tr/offer-preview/... biçimlerinin ikisini de kapsar
  const withoutLocale = pathname.replace(LOCALE_PATTERN, "/");
  return PUBLIC_PREFIXES.some(
    (prefix) =>
      withoutLocale === prefix || withoutLocale.startsWith(`${prefix}/`)
  );
}

export default async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const hasLocale = LOCALE_PATTERN.test(pathname);
  const locale = hasLocale
    ? pathname.split("/")[1]
    : req.cookies.get("NEXT_LOCALE")?.value || routing.defaultLocale;

  // Middleware yalnızca httpOnly session cookie'sine bakar; localStorage'a değil.
  const session = await decrypt(req.cookies.get("session")?.value);
  const hasSession = !!session?.data?.token;

  const publicPath = isPublicPath(pathname);

  if (!publicPath && !hasSession) {
    const returnUrl = encodeURIComponent(`${pathname}${search}`);
    return NextResponse.redirect(
      new URL(`/${locale}?returnUrl=${returnUrl}`, req.nextUrl)
    );
  }

  // Oturum açıkken login ekranı yerine varsayılan sayfaya git.
  // offer-preview public ama oturumlu kullanıcı da görebilmeli — dışarıda bırakılır.
  if (hasSession && PUBLIC_PATHS.includes(pathname)) {
    const target = new URL(`/${locale}${Routes.Default}`, req.url);
    target.search = search;
    return NextResponse.redirect(target);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/",
    "/(tr|en)/:path*",
    // hubapi: yerel API proxy'si (next.config.ts rewrites) — oturum/locale işlemesi yok
    "/((?!_next|api|hubapi|static|favicon.ico|.*\\..*).*)",
  ],
};
