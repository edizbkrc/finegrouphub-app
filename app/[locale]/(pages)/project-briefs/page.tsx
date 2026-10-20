"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { Row } from "@tanstack/react-table";
import { IconButton, Tooltip } from "@mui/material";
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { useOpsModal } from "@hooks/useOpsModal";
import { usePageAction } from "@hooks/usePageAction";
import { OpsPageNames } from "@enums/OpsPageNames";
import OpsTablePage from "@layout/OpsTablePage";
import OpsTableProvider from "@opsTable/components/OpsTableProvider";
import { TableService } from "@opsTable/services/OpsTableServices";
import StateChangeDialog from "@components/dialogs/StateChangeDialog";

const Form = dynamic(() => import("@forms/ProjectBriefForm"));

const opsService = new TableService(ApiRoutes.ProjectBriefs, ApiRoutes.ProjectBriefDetail, "projectBriefId");

/** ProjectBriefState: Blocked, CanceledByCompany, CanceledByFineHub → gerekçe zorunlu. */
const REASON_REQUIRED = [5, 6, 7];

interface IBriefRow {
  id: number;
  projectName?: string;
  state?: number;
}

export default function ProjectBriefsPage() {
  const t = useTranslations();
  const { opsModalVisible } = useOpsModal();
  const canChangeState = usePageAction(OpsPageNames.ProjectBriefManagement, "UpdateProjectBriefState");
  const [stateRow, setStateRow] = useState<IBriefRow | null>(null);

  useEffect(() => {
    opsService.initialProcess();
  }, []);

  const stateIcon = (row: Row<unknown>) =>
    canChangeState ? (
      <Tooltip title={t("Button.ChangeState")}>
        <IconButton onClick={(event) => { event.stopPropagation(); setStateRow(row.original as IBriefRow); }} data-cy={`brief-state-${row.id}`}>
          <PublishedWithChangesIcon color="primary" />
        </IconButton>
      </Tooltip>
    ) : null;

  return (
    <OpsTablePage pageName={OpsPageNames.ProjectBriefManagement}>
      <OpsTableProvider
        opsService={opsService}
        pageName={OpsPageNames.ProjectBriefManagement}
        actionIcons={[stateIcon]}
        tableProps={{ showEditIcon: true, showDeleteIcon: true, lastDisabledRowId: 0 }}
      />
      {opsModalVisible && <Form opsService={opsService} />}
      <StateChangeDialog
        open={!!stateRow}
        title={`${t("Button.ChangeState")} — ${stateRow?.projectName ?? ""}`}
        enumName="ProjectBriefState"
        currentState={stateRow?.state}
        reasonRequiredFor={REASON_REQUIRED}
        onClose={() => setStateRow(null)}
        onSubmit={async ({ stateTo, reason }) => {
          const res = await axiosInstance
            .put(ApiRoutes.ProjectBriefState, { id: stateRow?.id, stateTo, reason: reason || null })
            .catch(() => null);
          if (!res?.data?.isSuccess) return false;
          opsService.refresh();
          return true;
        }}
      />
    </OpsTablePage>
  );
}
