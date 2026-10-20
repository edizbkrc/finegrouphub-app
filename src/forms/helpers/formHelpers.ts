import type { ILookupRequest } from "@common/types/ILookupRequest";

interface INavigation {
  id?: unknown;
  name?: string | null;
}

/**
 * Genel entity lookup isteği (`PATCH /v1/Lookups`). `requestedPropertyNames[0]`
 * seçenek başlığı olur (bkz. AutoSelect).
 */
export const lookup = (entityName: string, requestedPropertyNames: string[] = ["Name"]): ILookupRequest => ({
  entityName,
  requestedPropertyNames,
});

/**
 * Detay DTO'larındaki `{ id, name }` navigasyon nesnesinden AutoSelect varsayılan
 * değerini üretir. Örn. `navigationDefault("bankAccount")` → `apiData.bankAccount`.
 */
export const navigationDefault =
  (key: string) =>
  (apiData: unknown): { id: unknown; title: string } | null => {
    const nav = (apiData as Record<string, INavigation | null | undefined> | null)?.[key];
    if (!nav || nav.id === undefined || nav.id === null) return null;
    return { id: nav.id, title: nav.name ?? String(nav.id) };
  };

/** Düz bir enum alanından (değer + açıklama) AutoSelect varsayılanı üretir. */
export const enumDefault =
  (valueKey: string, descriptionKey: string) =>
  (apiData: unknown): { id: unknown; title: string } | null => {
    const data = apiData as Record<string, unknown> | null;
    const value = data?.[valueKey];
    if (value === undefined || value === null) return null;
    return { id: value, title: String(data?.[descriptionKey] ?? value) };
  };
