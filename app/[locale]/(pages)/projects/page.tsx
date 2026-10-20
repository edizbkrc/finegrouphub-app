"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Row } from "@tanstack/react-table";
import { IconButton, Tooltip } from "@mui/material";
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { Routes } from "@enums/Routes";
import { OpsPageNames } from "@enums/OpsPageNames";
import { usePageAction } from "@hooks/usePageAction";
import OpsTablePage from "@layout/OpsTablePage";
import OpsTableProvider from "@opsTable/components/OpsTableProvider";
import { TableService } from "@opsTable/services/OpsTableServices";
import StateChangeDialog from "@components/dialogs/StateChangeDialog";

const opsService = new TableService(ApiRoutes.Projects, ApiRoutes.ProjectDetail, "projectId");

/** API her proje durumu değişikliğinde gerekçe ister (UpdateFineProjectStateValidator). */
const REASON_REQUIRED = [0, 1, 2, 3, 4];

interface IProjectRow {
  id: number;
  name?: string;
  state?: number;
}

/** Projeler siparişten doğar (sipariş tamamlanınca); burada yeni proje oluşturulmaz. */
export default function ProjectsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const canChangeState = usePageAction(OpsPageNames.ProjectManagement, "UpdateProjectState");
  const [stateRow, setStateRow] = useState<IProjectRow | null>(null);

  useEffect(() => {
    opsService.initialProcess();
  }, []);

  const detailUrl = (row: Row<unknown>) => `/${locale}${Routes.Project}/${(row.original as IProjectRow)?.id}`;

  const stateIcon = (row: Row<unknown>) =>
    canChangeState ? (
      <Tooltip title={t("Button.ChangeState")}>
        <IconButton
          onClick={(event) => {
            event.stopPropagation();
            setStateRow(row.original as IProjectRow);
          }}
          data-cy={`project-state-${row.id}`}
        >
          <PublishedWithChangesIcon color="primary" />
        </IconButton>
      </Tooltip>
    ) : null;

  return (
    <OpsTablePage disableAddNew>
      <OpsTableProvider
        opsService={opsService}
        pageName={OpsPageNames.ProjectManagement}
        actionIcons={[stateIcon]}
        tableProps={{ showEditIcon: true, showDeleteIcon: true, getEditUrl: detailUrl, lastDisabledRowId: 0 }}
      />
      <StateChangeDialog
        open={!!stateRow}
        title={`${t("Button.ChangeState")} — ${stateRow?.name ?? ""}`}
        enumName="ProjectState"
        currentState={stateRow?.state}
        reasonRequiredFor={REASON_REQUIRED}
        onClose={() => setStateRow(null)}
        onSubmit={async ({ stateTo, reason }) => {
          const res = await axiosInstance.put(ApiRoutes.ProjectState, { id: stateRow?.id, stateTo, reason: reason || null }).catch(() => null);
          if (!res?.data?.isSuccess) return false;
          opsService.refresh();
          return true;
        }}
      />
    </OpsTablePage>
  );
}
