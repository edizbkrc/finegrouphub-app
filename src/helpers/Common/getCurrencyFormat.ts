import { CurrencyEnum } from "@helpers/types/CurrencyEnum";
import { LocalStorageKeysEnum } from "@enums/LocalStorageKeysEnum";
import { localStorageService } from "./localStorageService";
import type { ILoginSystemInfo } from "@/types/ILoginSystemInfo";

const CURRENCY_CODES: Record<CurrencyEnum, string> = {
  [CurrencyEnum.TRY]: "TRY",
  [CurrencyEnum.USD]: "USD",
};

const SYMBOL_TO_CODE: Record<string, string> = {
  "₺": "TRY",
  $: "USD",
  "€": "EUR",
  "£": "GBP",
  "₩": "KRW",
  "¥": "JPY",
};

/**
 * ⚠️ Referansta `JSON.parse(localStorageService.getItem(...))` yazılıyordu.
 * `getItem` zaten parse edilmiş nesne döndürdüğü için `JSON.parse` bir nesne
 * üzerinde çağrılıyor, fırlatıyor ve catch bloğu her seferinde TRY'ye
 * düşüyordu — sistem para birimi USD olsa bile TRY gösteriliyordu.
 */
function getSystemInfo(): ILoginSystemInfo | null {
  try {
    return localStorageService.getItem(LocalStorageKeysEnum.SystemInfo) ?? null;
  } catch {
    return null;
  }
}

function getCurrencyCode(): string {
  const currency = getSystemInfo()?.currency as unknown as CurrencyEnum;
  return CURRENCY_CODES[currency] ?? "TRY";
}

/**
 * Para birimi biçimi arayüz diline göre belirlenir.
 *
 * Not: referans `systemInfo.language` okuyordu ama `ILoginSystemInfo`'da böyle
 * bir alan yok — her zaman varsayılana düşüyordu. Panelin aktif dili kullanılır.
 */
function getCurrencyLocale(): string {
  const language = localStorageService.getItem(LocalStorageKeysEnum.Language);
  return language === "en" ? "en-US" : "tr-TR";
}

export const getCurrencyFormat = (value?: number, symbol?: string): string =>
  new Intl.NumberFormat(getCurrencyLocale(), {
    style: "currency",
    currency: symbol || getCurrencyCode(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0);

export function getCurrencySymbol(symbol?: string): string {
  return (symbol && SYMBOL_TO_CODE[symbol]) || "TRY";
}
