"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { ApiRoutes } from "@network/ApiRoutes";
import { useOpsModal } from "@hooks/useOpsModal";
import OpsTablePage from "@layout/OpsTablePage";
import OpsTableProvider from "@opsTable/components/OpsTableProvider";
import { TableService } from "@opsTable/services/OpsTableServices";

const Form = dynamic(() => import("@forms/ExpenseRevenueCategoryForm"));

// Detay/silme sorgu parametresi "expenseRevenueCategoryId". Id 1–2 seed (Sipariş/Bakım Ödemesi), değiştirilemez.
const opsService = new TableService(
  ApiRoutes.ExpenseRevenueCategories,
  ApiRoutes.ExpenseRevenueCategoryDetail,
  "expenseRevenueCategoryId"
);

export default function ExpenseRevenueCategoriesPage() {
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
