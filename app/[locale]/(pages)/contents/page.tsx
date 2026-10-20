"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { ApiRoutes } from "@network/ApiRoutes";
import { useOpsModal } from "@hooks/useOpsModal";
import OpsTablePage from "@layout/OpsTablePage";
import OpsTableProvider from "@opsTable/components/OpsTableProvider";
import { TableService } from "@opsTable/services/OpsTableServices";

const Form = dynamic(() => import("@forms/ContentForm"));

// Detay "contentId"; silme toplu uçtan: DELETE /v1/cms/contents { contentIdList: [] }.
const opsService = new TableService(ApiRoutes.Contents, ApiRoutes.ContentDetail, "contentId", true, "contentIdList");

export default function ContentsPage() {
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
