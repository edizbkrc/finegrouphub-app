import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "tr"],
  defaultLocale: "tr",
});

export type AppLocale = (typeof routing.locales)[number];

export const isAppLocale = (value: unknown): value is AppLocale =>
  typeof value === "string" && (routing.locales as readonly string[]).includes(value);
