import { Plus_Jakarta_Sans } from "next/font/google";

/**
 * Panel yazı tipi — Plus Jakarta Sans.
 * Manrope / Fine Group turuncu-lacivert dilinden bağımsız, modern SaaS hissi.
 * `latin-ext` Türkçe karakterler için gerekli. `--font-app` MUI tipografisine bağlı.
 */
export const appFont = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-app",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});
