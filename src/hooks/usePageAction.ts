"use client";

import { usePageInformation } from "./usePageInformation";

/**
 * Sayfanın ek aksiyonlarından (örn. "UpdateOfferState") birine kullanıcının
 * erişimi var mı? `GET /v1/UI/pages` yalnızca kullanıcının erişebildiği
 * aksiyonları `additionalActions` içinde döndürür.
 */
export const usePageAction = (pageName: string, actionName: string): boolean => {
  const pageInfo = usePageInformation(pageName);
  return !!pageInfo?.additionalActions?.some((action) => action?.actionName === actionName);
};
