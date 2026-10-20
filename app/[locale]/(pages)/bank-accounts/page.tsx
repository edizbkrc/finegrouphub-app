"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { ApiRoutes } from "@network/ApiRoutes";
import { useOpsModal } from "@hooks/useOpsModal";
import OpsTablePage from "@layout/OpsTablePage";
import OpsTableProvider from "@opsTable/components/OpsTableProvider";
import { TableService } from "@opsTable/services/OpsTableServices";

const Form = dynamic(() => import("@forms/BankAccountForm"));

// D1 istisnası: detay/silme sorgu parametresi "BankAccountId" (bkz. docs/API_ADAPTER.md §6/§7).
const opsService = new TableService(ApiRoutes.BankAccounts, ApiRoutes.BankAccountDetail, "BankAccountId");

export default function BankAccountsPage() {
  const { opsModalVisible } = useOpsModal();

  useEffect(() => {
    opsService.initialProcess();
  }, []);

  return (
    <OpsTablePage>
      <OpsTableProvider opsService={opsService} tableProps={{ showEditIcon: true, showDeleteIcon: true }} />
      {opsModalVisible && <Form opsService={opsService} />}
    </OpsTablePage>
  );
}
