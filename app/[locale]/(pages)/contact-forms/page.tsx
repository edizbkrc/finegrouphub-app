"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { ApiRoutes } from "@network/ApiRoutes";
import { useOpsModal } from "@hooks/useOpsModal";
import OpsTablePage from "@layout/OpsTablePage";
import OpsTableProvider from "@opsTable/components/OpsTableProvider";
import { TableService } from "@opsTable/services/OpsTableServices";

const Form = dynamic(() => import("@forms/ContactFormForm"));

// Silme toplu uçtan yapılır: DELETE /v1/contactforms { contactFormIdList: [] }.
const opsService = new TableService(
  ApiRoutes.ContactForms,
  ApiRoutes.ContactFormDetail,
  "id",
  true,
  "contactFormIdList"
);

export default function ContactFormsPage() {
  const { opsModalVisible } = useOpsModal();

  useEffect(() => {
    opsService.initialProcess();
  }, []);

  return (
    <OpsTablePage disableAddNew>
      <OpsTableProvider
        opsService={opsService}
        tableProps={{ showEditIcon: true, showDeleteIcon: true, useTableData: true, lastDisabledRowId: 0 }}
      />
      {opsModalVisible && <Form opsService={opsService} />}
    </OpsTablePage>
  );
}
