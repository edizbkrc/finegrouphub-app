"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import type { Row } from "@tanstack/react-table";
import { ApiRoutes } from "@network/ApiRoutes";
import { useOpsModal } from "@hooks/useOpsModal";
import { Routes } from "@enums/Routes";
import OpsTablePage from "@layout/OpsTablePage";
import OpsTableProvider from "@opsTable/components/OpsTableProvider";
import { TableService } from "@opsTable/services/OpsTableServices";

const Form = dynamic(() => import("@forms/TicketCreateForm"));

const opsService = new TableService(ApiRoutes.Tickets, ApiRoutes.TicketDetail, "ticketId");

export default function TicketsPage() {
  const locale = useLocale();
  const router = useRouter();
  const { opsModalVisible } = useOpsModal();

  useEffect(() => {
    opsService.initialProcess();
  }, []);

  const openDetail = (row: Row<unknown>) => {
    const id = (row.original as { id?: unknown })?.id;
    router.push(`/${locale}${Routes.Ticket}/${id}`);
  };

  return (
    <OpsTablePage>
      <OpsTableProvider
        opsService={opsService}
        onRowClick={openDetail}
        tableProps={{ showEditIcon: true, showDeleteIcon: true, handleEditIconClick: openDetail, lastDisabledRowId: 0 }}
      />
      {opsModalVisible && <Form opsService={opsService} />}
    </OpsTablePage>
  );
}
