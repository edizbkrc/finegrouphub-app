"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { Row } from "@tanstack/react-table";
import { Alert, Box, Button, Tab, Tabs } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { Routes } from "@enums/Routes";
import { OpsPageNames } from "@enums/OpsPageNames";
import OpsTableProvider from "@opsTable/components/OpsTableProvider";
import { useProject } from "@/features/project/ProjectContext";
import { useProjectTable } from "@/features/project/useProjectTable";
import ProjectSection from "@/features/project/ProjectSection";
import BlockCreateDialog from "@/features/project/BlockCreateDialog";

interface IStage {
  id: number;
  name: string;
}

function StageBlocks({ projectId, stageId, createOpen, setCreateOpen }: { projectId: number; stageId: number; createOpen: boolean; setCreateOpen: (open: boolean) => void }) {
  const locale = useLocale();
  // Liste etap bazlı: gövdede projectId + projectStageId. Silme sorgu parametresi "id".
  const service = useProjectTable(ApiRoutes.Blocks, ApiRoutes.BlockDetail, "blockId", projectId, {
    extraParams: { projectStageId: stageId },
    deleteKey: "id",
  });
  const detailUrl = (row: Row<unknown>) =>
    `/${locale}${Routes.Project}/${projectId}/blocks/${(row.original as { id?: number })?.id}?stageId=${stageId}`;

  return (
    <>
      <OpsTableProvider
        opsService={service}
        pageName={OpsPageNames.ProjectOperationManagement}
        tableProps={{ showEditIcon: true, showDeleteIcon: true, getEditUrl: detailUrl, lastDisabledRowId: 0 }}
      />
      <BlockCreateDialog open={createOpen} projectId={projectId} stageId={stageId} onClose={() => setCreateOpen(false)} onCreated={() => service.refresh()} />
    </>
  );
}

/** Bloklar etaplara bağlıdır: üstte etap sekmeleri, altta seçili etabın blokları. */
export default function BlocksPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { projectId } = useProject();
  const [stages, setStages] = useState<IStage[] | null>(null);
  const [active, setActive] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const requestedStageId = Number(useSearchParams().get("stageId")) || undefined;

  useEffect(() => {
    axiosInstance
      .patch(ApiRoutes.Stages, { pageNumber: 1, rowCount: 100, projectId }, { withoutToast: true })
      .then((res) => {
        const rows = ((res?.data?.data as IStage[]) ?? []).map((stage) => ({ id: stage.id, name: stage.name }));
        setStages(rows);
        // Hub'daki etap kartından gelindiyse ilgili etabın sekmesi açılır.
        const index = rows.findIndex((stage) => stage.id === requestedStageId);
        if (index >= 0) setActive(index);
      })
      .catch(() => setStages([]));
    // stageId yalnızca ilk yüklemede okunur; sekme değişince yeniden istek atılmasın.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (stages === null) return null;

  // Bloklar etaba bağlı; kullanıcı etap yokken çıkmaz sokakta kalmasın, etap sayfasına dönebilsin.
  const stagesHref = `/${locale}${Routes.Project}/${projectId}/stages`;
  const backToStages = (
    <Button component={Link} href={stagesHref} variant="outlined" color="tertiary" startIcon={<ArrowBack />} data-cy="blocks-back-stages">
      {t("Project.BackToStages")}
    </Button>
  );

  if (stages.length === 0) {
    return (
      <ProjectSection title={t("Form.Blocks")} right={backToStages}>
        <Alert severity="info">{t("Project.NoStages")}</Alert>
      </ProjectSection>
    );
  }

  const stage = stages[Math.min(active, stages.length - 1)];

  return (
    <ProjectSection title={t("Form.Blocks")} onAdd={() => setCreateOpen(true)} addLabel={t("Form.AddBlock")} right={backToStages}>
      <Tabs value={active} onChange={(_, value) => setActive(value)} sx={{ mb: 2 }} variant="scrollable">
        {stages.map((item) => (
          <Tab key={item.id} label={item.name} data-cy={`stage-tab-${item.id}`} />
        ))}
      </Tabs>
      <Box key={stage.id}>
        <StageBlocks projectId={projectId} stageId={stage.id} createOpen={createOpen} setCreateOpen={setCreateOpen} />
      </Box>
    </ProjectSection>
  );
}
