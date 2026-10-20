"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsTablePage from "@layout/OpsTablePage";
import { TableService } from "@opsTable/services/OpsTableServices";
import OpsTableProvider from "@opsTable/components/OpsTableProvider";
import { Routes } from "@enums/Routes";
import type { Row } from "@tanstack/react-table";

// D1 istisnası: Roles grubu detay/silme sorgu parametresi "RoleId" bekliyor
// (bkz. docs/API_ADAPTER.md §6).
const opsService = new TableService(ApiRoutes.Roles, ApiRoutes.RoleDetail, "RoleId");

export default function RolesPage() {
  const locale = useLocale();
  const router = useRouter();

  useEffect(() => {
    opsService.initialProcess();
  }, []);

  const onNewButtonClick = () => router.push(`/${locale}${Routes.AddRole}`);

  const onEditIconClick = (row: Row<unknown>) => {
    const id = (row.original as { id?: unknown })?.id;
    router.push(`/${locale}${Routes.EditRole}/${id}`);
  };

  return (
    <OpsTablePage defaultButtonOnClick={onNewButtonClick}>
      <OpsTableProvider
        opsService={opsService}
        tableProps={{
          showEditIcon: true,
          showDeleteIcon: true,
          handleEditIconClick: onEditIconClick,
          lastDisabledRowId: 4999,
        }}
      />
    </OpsTablePage>
  );
}
