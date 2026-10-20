"use client";

import { useCallback, useState } from "react";
import { localStorageService } from "@helpers/Common/localStorageService";
import { LocalStorageKeysEnum } from "@enums/LocalStorageKeysEnum";
import type { IMenuItem } from "@common/types/IMenuItem";

/**
 * Sol navigasyonun kaynağı. Menü tanımı kodda YOKTUR — tamamen API'den gelen
 * `accessibleMenuItems` üzerinden üretilir.
 */
function useAccessibleMenuItems() {
  const [accessibleMenuItems, setAccessibleMenuItems] = useState<IMenuItem[]>(
    []
  );

  const getMenuItems = useCallback(() => {
    // ⚠️ Referansta `getItem(KEY || "[]")` yazılmıştı — `|| "[]"` yanlış yere,
    // getItem'ın ARGÜMANINA konmuştu; enum değeri hiçbir zaman falsy olmadığı
    // için fallback ölü koddu.
    const data = localStorageService.getItem(
      LocalStorageKeysEnum.AccessibleMenuItems
    );

    setAccessibleMenuItems(Array.isArray(data) ? data : []);
  }, []);

  return { accessibleMenuItems, getMenuItems } as const;
}

export default useAccessibleMenuItems;
