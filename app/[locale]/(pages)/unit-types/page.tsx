"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { ApiRoutes } from "@network/ApiRoutes";
import { useOpsModal } from "@hooks/useOpsModal";
import { OpsPageNames } from "@enums/OpsPageNames";
import OpsTablePage from "@layout/OpsTablePage";
import OpsTableProvider from "@opsTable/components/OpsTableProvider";
import { TableService } from "@opsTable/services/OpsTableServices";

const Form = dynamic(() => import("@forms/UnitTypeForm"));

const opsService = new TableService(ApiRoutes.UnitTypes, ApiRoutes.UnitTypeDetail, "unitTypeId");

export default function UnitTypesPage() {
  const { opsModalVisible } = useOpsModal();

  useEffect(() => {
    opsService.initialProcess();
  }, []);

  return (
    <OpsTablePage pageName={OpsPageNames.UnitTypeManagement}>
      <OpsTableProvider
        opsService={opsService}
        pageName={OpsPageNames.UnitTypeManagement}
        tableProps={{ showEditIcon: true, showDeleteIcon: true }}
      />
      {opsModalVisible && <Form opsService={opsService} />}
    </OpsTablePage>
  );
}
