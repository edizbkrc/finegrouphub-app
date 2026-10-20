"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { ApiRoutes } from "@network/ApiRoutes";
import { useOpsModal } from "@hooks/useOpsModal";
import OpsTablePage from "@layout/OpsTablePage";
import OpsTableProvider from "@opsTable/components/OpsTableProvider";
import { TableService } from "@opsTable/services/OpsTableServices";

const Form = dynamic(() => import("@forms/ContractTemplateForm"));

// ContractTemplates grubu detay/silme sorgu parametresi "id" (Users/Roles'ten farklı olarak
// D1 istisnası GEREKMİYOR — bkz. docs/API_ADAPTER.md §7).
const opsService = new TableService(ApiRoutes.ContractTemplates, ApiRoutes.ContractTemplateDetail);

export default function ContractTemplatesPage() {
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
