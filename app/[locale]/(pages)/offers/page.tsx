"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import type { Row } from "@tanstack/react-table";
import { ApiRoutes } from "@network/ApiRoutes";
import { Routes } from "@enums/Routes";
import OpsTablePage from "@layout/OpsTablePage";
import OpsTableProvider from "@opsTable/components/OpsTableProvider";
import { TableService } from "@opsTable/services/OpsTableServices";

const opsService = new TableService(ApiRoutes.Offers, ApiRoutes.OfferDetail, "offerId");

export default function OffersPage() {
  const locale = useLocale();

  useEffect(() => {
    opsService.initialProcess();
  }, []);

  const detailUrl = (row: Row<unknown>) => `/${locale}${Routes.Offer}/${(row.original as { id?: unknown })?.id}`;

  return (
    <OpsTablePage href={Routes.Offer}>
      <OpsTableProvider opsService={opsService} tableProps={{ showEditIcon: true, showDeleteIcon: false, getEditUrl: detailUrl }} />
    </OpsTablePage>
  );
}
