import queryString from "query-string";
import type { IListRequest } from "@common/types/IListRequest";

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_ROW_COUNT = 10;

/** Bozuk JSON'da undefined döner — URL kullanıcı tarafından düzenlenebilir. */
function safeParse<T>(value: unknown): T | undefined {
  if (typeof value !== "string" || !value) return undefined;

  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function safeInt(value: unknown, fallback: number): number {
  const parsed = parseInt(value as string, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Query string'i liste isteğine çevirir.
 *
 * Tablo durumu (sayfa, filtre, sıralama, aggregation) URL'de yaşar; kullanıcılar
 * filtreli URL paylaşıyor. Bu davranış korunur.
 *
 * ⚠️ Referansta iki sorun vardı:
 *  1. `parseInt(parsed.pageNumber)` — parametre yoksa NaN üretiyor ve API'ye
 *     `pageNumber: NaN` gidiyordu. Yalnızca query TAMAMEN boşsa varsayılana
 *     düşülüyordu; `?filtering=...` gibi kısmi URL'lerde bozuluyordu.
 *  2. `JSON.parse` korumasızdı — elle düzenlenmiş/bozuk bir URL sayfayı
 *     çökertiyordu.
 */
export function queryStringToListRequest(query: string): IListRequest {
  if (!query) {
    return { pageNumber: DEFAULT_PAGE_NUMBER, rowCount: DEFAULT_ROW_COUNT };
  }

  const parsed = queryString.parse(query);

  return {
    pageNumber: safeInt(parsed.pageNumber, DEFAULT_PAGE_NUMBER),
    rowCount: safeInt(parsed.rowCount, DEFAULT_ROW_COUNT),
    filtering: safeParse<IListRequest["filtering"]>(parsed.filtering),
    sorting: safeParse<IListRequest["sorting"]>(parsed.sorting),
    aggregation: safeParse<IListRequest["aggregation"]>(parsed.aggregation),
  };
}
