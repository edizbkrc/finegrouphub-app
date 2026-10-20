"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { ApiRoutes } from "@network/ApiRoutes";
import { useOpsModal } from "@hooks/useOpsModal";
import { OpsPageNames } from "@enums/OpsPageNames";
import OpsTablePage from "@layout/OpsTablePage";
import OpsTableProvider from "@opsTable/components/OpsTableProvider";
import { TableService } from "@opsTable/services/OpsTableServices";

const Form = dynamic(() => import("@forms/FineFeatureGroupForm"));

const opsService = new TableService(ApiRoutes.FeatureGroups, ApiRoutes.FeatureGroupDetail, "fineFeatureGroupId");

export default function FineFeatureGroupsPage() {
  const { opsModalVisible } = useOpsModal();

  useEffect(() => {
    opsService.initialProcess();
  }, []);

  return (
    <OpsTablePage pageName={OpsPageNames.FeatureGroupManagement}>
      <OpsTableProvider
        opsService={opsService}
        pageName={OpsPageNames.FeatureGroupManagement}
        tableProps={{ showEditIcon: true, showDeleteIcon: true, lastDisabledRowId: 0 }}
      />
      {opsModalVisible && <Form opsService={opsService} />}
    </OpsTablePage>
  );
}
