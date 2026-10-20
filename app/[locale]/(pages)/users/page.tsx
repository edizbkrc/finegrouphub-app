"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsTablePage from "@layout/OpsTablePage";
import { TableService } from "@opsTable/services/OpsTableServices";
import OpsTableProvider from "@opsTable/components/OpsTableProvider";
import { ExportTypeEnum } from "@opsTable/constants/ExportTypeEnum";
import { Routes } from "@enums/Routes";
import type { Row } from "@tanstack/react-table";

// D1 istisnası: Users grubu detay/silme sorgu parametresi "UserId" bekliyor,
// panelin varsayılanı "id" değil (bkz. docs/API_ADAPTER.md §6 — backend'de
// henüz normalize edilmedi, istisna burada tanımlı).
const opsService = new TableService(ApiRoutes.Users, ApiRoutes.UserDetail, "UserId");

export default function UsersPage() {
  const locale = useLocale();
  const router = useRouter();

  useEffect(() => {
    opsService.initialProcess();
  }, []);

  const onEditIconClick = (row: Row<unknown>) => {
    const id = (row.original as { id?: unknown })?.id;
    router.push(`/${locale}${Routes.User}/${id}`);
  };

  return (
    <OpsTablePage href={Routes.User}>
      <OpsTableProvider
        opsService={opsService}
        tableProps={{
          showEditIcon: true,
          showDeleteIcon: true,
          handleEditIconClick: onEditIconClick,
          lastDisabledRowId: 4999,
          exportType: ExportTypeEnum.User,
        }}
      />
    </OpsTablePage>
  );
}
