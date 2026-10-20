import { getRequestConfig } from "next-intl/server";
import { isAppLocale, routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  // `as any` yerine tip koruyucu (D4: strict build)
  const locale = isAppLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`./${locale}.json`)).default,
  };
});
