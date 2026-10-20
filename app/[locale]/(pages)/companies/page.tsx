"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsTablePage from "@layout/OpsTablePage";
import OpsTableProvider from "@opsTable/components/OpsTableProvider";
import { TableService } from "@opsTable/services/OpsTableServices";
import { Routes } from "@enums/Routes";
import type { Row } from "@tanstack/react-table";

/**
 * D1 istisnası — TenantId ("acme_1" gibi bileşik bir dize) uçlar arasında
 * TUTARSIZ: detay GET `?tenantId=`, silme DELETE `?id=` bekliyor
 * (bkz. docs/API_ADAPTER.md §7). `TableService`'in ayrı `deletePropertyName`
 * parametresi tam bunun için eklendi.
 */
const opsService = new TableService(
  ApiRoutes.Companies,
  ApiRoutes.CompanyDetail,
  "tenantId",
  false,
  "ids",
  undefined,
  undefined,
  "id"
);

export default function CompaniesPage() {
  const locale = useLocale();

  useEffect(() => {
    opsService.initialProcess();
  }, []);

  return (
    // Referans (finehub) gibi: "Yeni" butonu ve satır tıklaması modal değil, ayrı sayfaya gider.
    <OpsTablePage href={Routes.Company}>
      <OpsTableProvider
        opsService={opsService}
        tableProps={{
          showEditIcon: true,
          showDeleteIcon: true,
          // Bileşik tenant kimliği ("acme_1") URL'de güvenli olsun diye kodlanır; detay sayfası çözer.
          getEditUrl: (row: Row<unknown>) =>
            `/${locale}${Routes.Company}/${encodeURIComponent(String((row.original as { id?: unknown })?.id ?? ""))}`,
        }}
      />
    </OpsTablePage>
  );
}
