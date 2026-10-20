"use client";

import { useEffect } from "react";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsTablePage from "@layout/OpsTablePage";
import OpsTableProvider from "@opsTable/components/OpsTableProvider";
import { TableService } from "@opsTable/services/OpsTableServices";

// Salt okunur denetim kaydı: oluşturma/düzenleme/silme yok (API'de de yalnız liste ucu var).
const opsService = new TableService(ApiRoutes.ActivityLogs);

export default function ActivityLogsPage() {
  useEffect(() => {
    opsService.initialProcess();
  }, []);

  return (
    <OpsTablePage disableAddNew>
      <OpsTableProvider opsService={opsService} tableProps={{ showEditIcon: false, showDeleteIcon: false }} />
    </OpsTablePage>
  );
}
