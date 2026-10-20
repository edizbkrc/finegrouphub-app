"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { ApiRoutes } from "@network/ApiRoutes";
import { useOpsModal } from "@hooks/useOpsModal";
import OpsTablePage from "@layout/OpsTablePage";
import OpsTableProvider from "@opsTable/components/OpsTableProvider";
import { TableService } from "@opsTable/services/OpsTableServices";

const Form = dynamic(() => import("@forms/LanguageForm"));

// Detay ucu yok; TableService.CRUDUrl yalnızca PUT için kullanılır (useTableData: true, GET atlanır).
const opsService = new TableService(ApiRoutes.Languages, ApiRoutes.LanguageDetail);

export default function LanguagesPage() {
  const { opsModalVisible } = useOpsModal();

  useEffect(() => {
    opsService.initialProcess();
  }, []);

  return (
    <OpsTablePage disableAddNew>
      <OpsTableProvider opsService={opsService} tableProps={{ useTableData: true }} />
      {opsModalVisible && <Form opsService={opsService} />}
    </OpsTablePage>
  );
}
