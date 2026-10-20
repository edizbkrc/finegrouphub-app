"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { localStorageService } from "@helpers/Common/localStorageService";
import { lowercaseFirstLetter } from "@helpers/Common/lowercaseFirstLetter";
import { LocalStorageKeysEnum } from "@enums/LocalStorageKeysEnum";
import type { IPageDto } from "@common/types/IPageDto";
import type { IMenuItem } from "@common/types/IMenuItem";

const findMenuItemByUrl = (
  items: IMenuItem[],
  url: string
): IMenuItem | null => {
  for (const item of items) {
    if (item.url === url) return item;

    if (item.childrens?.length) {
      const child = findMenuItemByUrl(item.childrens, url);
      if (child) return child;
    }
  }
  return null;
};

/**
 * Aktif sayfanın izinlerini döndürür.
 *
 * pathname'in son segmentinden menü öğesini bulur, oradaki `pageName` ile
 * `pageInformations` içinden izin kaydını çeker. `pageName` doğrudan da
 * verilebilir (menüde karşılığı olmayan sayfalar için).
 *
 * Her aksiyon butonu bu hook'a bağlıdır — izinsiz buton render edilmez.
 */
export const usePageInformation = (pageName?: string): IPageDto | null => {
  const [pageInformation, setPageInformation] = useState<IPageDto | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const accessibleMenuItems: IMenuItem[] =
      localStorageService.getItem(LocalStorageKeysEnum.AccessibleMenuItems) ??
      [];
    const pageInformations: IPageDto[] =
      localStorageService.getItem(LocalStorageKeysEnum.PageInformations) ?? [];

    const segments = pathname?.split("/").filter(Boolean) ?? [];
    const lastSegment = `/${lowercaseFirstLetter(segments.pop() ?? "")}`;

    const menuItem = findMenuItemByUrl(accessibleMenuItems, lastSegment);
    const resolvedPageName = pageName ?? menuItem?.pageName;

    const pageInfo =
      pageInformations.find((info) => info?.name === resolvedPageName) ?? null;

    // ⚠️ Referansta bu atama `if (pageInfo)` içindeydi: izin kaydı bulunamayan
    // bir sayfaya geçildiğinde ÖNCEKİ sayfanın izinleri state'te kalıyor ve
    // kullanıcıya yetkisi olmayan butonlar görünüyordu. Koşulsuz set edilir.
    setPageInformation(pageInfo);
  }, [pageName, pathname]);

  return pageInformation;
};
