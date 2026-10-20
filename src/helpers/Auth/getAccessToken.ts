import { LocalStorageKeysEnum } from "@enums/LocalStorageKeysEnum";
import { localStorageService } from "../Common/localStorageService";

/** Ham access token (Bearer öneki YOK). */
export function getRawAccessToken(): string | null {
  try {
    return localStorageService.getItem(LocalStorageKeysEnum.AccessToken) ?? null;
  } catch {
    return null;
  }
}

/**
 * `Authorization` header değeri — "Bearer <token>".
 *
 * Not: referansta dosya adı `getAccensToken.ts` idi (yazım hatası), düzeltildi.
 */
export default function getAccessToken(): string | null {
  const token = getRawAccessToken();
  return token ? `Bearer ${token}` : null;
}
