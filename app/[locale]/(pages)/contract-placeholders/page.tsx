"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { ApiRoutes } from "@network/ApiRoutes";
import { useOpsModal } from "@hooks/useOpsModal";
import OpsTablePage from "@layout/OpsTablePage";
import OpsTableProvider from "@opsTable/components/OpsTableProvider";
import { TableService } from "@opsTable/services/OpsTableServices";

const Form = dynamic(() => import("@forms/ContractTemplatePlaceholderForm"));

const opsService = new TableService(ApiRoutes.ContractTemplatePlaceholders, ApiRoutes.ContractTemplatePlaceholderDetail);

export default function ContractTemplatePlaceholdersPage() {
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
