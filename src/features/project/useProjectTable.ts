"use client";

import { useEffect, useMemo } from "react";
import { TableService } from "@opsTable/services/OpsTableServices";
import type { ApiRoutes } from "@network/ApiRoutes";
import type { IMetadata } from "@common/types/IMetadata";

/**
 * Proje kapsamlı tablo servisi. Liste isteği gövdesine `projectId` (ve
 * verilirse ek alanlar, örn. `projectStageId`) eklenir. Detay/silme sorgu
 * parametre adları modülden modüle değişir (bkz. docs/api-endpoints.md).
 */
export const useProjectTable = (
  listUrl: ApiRoutes,
  detailUrl: ApiRoutes,
  detailKey: string,
  projectId: number,
  options?: {
    deleteKey?: string;
    extraParams?: Record<string, unknown>;
    multipleDelete?: string;
    /** false → liste isteği atılmaz (örn. katı olmayan blokta daire olamaz, sormak boşuna). */
    enabled?: boolean;
    /** Kolon metadata'sını tabloya girmeden değiştirir (ör. projeye özel alan adları). */
    metadataTransform?: (metadatas: IMetadata[]) => IMetadata[];
  }
) => {
  const enabled = options?.enabled ?? true;
  const extraKey = JSON.stringify(options?.extraParams ?? {});

  const service = useMemo(
    () =>
      new TableService(
        listUrl,
        detailUrl,
        detailKey,
        !!options?.multipleDelete,
        options?.multipleDelete ?? "ids",
        // Proje alt tablolarında URL'deki eski sorgu durumu taşınmasın.
        "?pageNumber=1&rowCount=10",
        { projectId, ...(options?.extraParams ?? {}) },
        options?.deleteKey
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [listUrl, detailUrl, detailKey, projectId, extraKey, options?.deleteKey, options?.multipleDelete]
  );

  // Render'da atanıyor (effect'te değil): ilk liste isteği aynı turdaki effect'te gidiyor
  // ve dönüşüm o yanıta da uygulanmalı.
  service.metadataTransform = options?.metadataTransform;

  useEffect(() => {
    if (enabled) service.initialProcess();
  }, [service, enabled]);

  return service;
};
