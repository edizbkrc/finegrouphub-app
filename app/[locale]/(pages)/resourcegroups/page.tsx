"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { ApiRoutes } from "@network/ApiRoutes";
import { useOpsModal } from "@hooks/useOpsModal";
import OpsTablePage from "@layout/OpsTablePage";
import OpsTableProvider from "@opsTable/components/OpsTableProvider";
import { TableService } from "@opsTable/services/OpsTableServices";

const Form = dynamic(() => import("@forms/ResourceGroupForm"));

const opsService = new TableService(ApiRoutes.ResourceGroups, ApiRoutes.ResourceGroupDetail, "resourceGroupId");

export default function ResourceGroupsPage() {
  const { opsModalVisible } = useOpsModal();

  useEffect(() => {
    opsService.initialProcess();
  }, []);

  return (
    <OpsTablePage>
      <OpsTableProvider opsService={opsService} tableProps={{ showEditIcon: true, showDeleteIcon: true, lastDisabledRowId: 0 }} />
      {opsModalVisible && <Form opsService={opsService} />}
    </OpsTablePage>
  );
}
