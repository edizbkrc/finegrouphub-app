import { LocalStorageKeysEnum } from "@enums/LocalStorageKeysEnum";
import { localStorageService } from "../Common/localStorageService";
import getAcceptLanguage from "./getAcceptLanguage";

/** `Accept-Language` header değeri (ör. "tr-TR"). */
export const getAppLanguage = (): string => {
  try {
    const language = localStorageService.getItem(LocalStorageKeysEnum.Language);
    return getAcceptLanguage(language);
  } catch {
    return getAcceptLanguage();
  }
};
