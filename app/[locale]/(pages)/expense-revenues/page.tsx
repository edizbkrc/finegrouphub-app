"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { ApiRoutes } from "@network/ApiRoutes";
import { useOpsModal } from "@hooks/useOpsModal";
import OpsTablePage from "@layout/OpsTablePage";
import OpsTableProvider from "@opsTable/components/OpsTableProvider";
import { TableService } from "@opsTable/services/OpsTableServices";
import { ExportTypeEnum } from "@opsTable/constants/ExportTypeEnum";

const Form = dynamic(() => import("@forms/ExpenseRevenueForm"));

const opsService = new TableService(ApiRoutes.ExpenseRevenues, ApiRoutes.ExpenseRevenueDetail, "expenseRevenueId");

export default function ExpenseRevenuesPage() {
  const { opsModalVisible } = useOpsModal();

  useEffect(() => {
    opsService.initialProcess();
  }, []);

  return (
    <OpsTablePage>
      <OpsTableProvider
        opsService={opsService}
        tableProps={{ showEditIcon: true, showDeleteIcon: true, lastDisabledRowId: 0, exportType: ExportTypeEnum.ExpenseRevenue }}
      />
      {opsModalVisible && <Form opsService={opsService} />}
    </OpsTablePage>
  );
}
