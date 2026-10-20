"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import type { Row } from "@tanstack/react-table";
import { Alert, Grid, Skeleton } from "@mui/material";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { Routes } from "@enums/Routes";
import { OpsPageNames } from "@enums/OpsPageNames";
import { useOpsModal } from "@hooks/useOpsModal";
import { usePageInformation } from "@hooks/usePageInformation";
import OpsPageFormDeleteDialog from "@common/page/OpsPageFormDeleteDialog";
import { useProject } from "@/features/project/ProjectContext";
import { useProjectTable } from "@/features/project/useProjectTable";
import ProjectSection from "@/features/project/ProjectSection";
import StageCard, { type IStageCardData } from "@/features/project/StageCard";

const Form = dynamic(() => import("@forms/project/StageForm"));

/**
 * Etaplar: kart ızgarası. Kart bloklara (`/blocks?stageId=`) gider; menüden düzenle/sil.
 * Ekleme/düzenleme StageForm modalıyla, silme onay diyaloğuyla yapılır.
 */
export default function StagesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { projectId, reload } = useProject();
  const { opsModalVisible, openOpsModal } = useOpsModal();
  const pageInfo = usePageInformation(OpsPageNames.ProjectOperationManagement);
  const canEdit = !!(pageInfo?.hasEdit && pageInfo?.userCanEdit);
  const canDelete = !!(pageInfo?.hasDelete && pageInfo?.userCanDelete);

  const [stages, setStages] = useState<IStageCardData[] | null>(null);
  const [selected, setSelected] = useState<IStageCardData | null>(null);

  // Detay "projectStageId", silme "fineProjectStageId" bekliyor. Servis yalnızca
  // düzenleme (detay çekme) ve silme için; liste kart ızgarası için ayrıca çekilir.
  const service = useProjectTable(ApiRoutes.Stages, ApiRoutes.StageDetail, "projectStageId", projectId, { deleteKey: "fineProjectStageId" });

  const load = useCallback(() => {
    // Liste isteği düz gövdede `projectId` ister (iç içe filtre değil).
    axiosInstance
      .patch(ApiRoutes.Stages, { pageNumber: 1, rowCount: 1000, projectId }, { withoutToast: true })
      .then((res) => {
        const rows = (res?.data?.data as IStageCardData[] | undefined) ?? [];
        // Sıralama istemcide: API sıralama alanı adına bağımlı kalmayalım.
        setStages([...rows].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
      })
      .catch(() => setStages([]));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  // Hub'daki etap sayısı ve diğer proje özeti de değişir.
  const refreshAll = useCallback(() => {
    load();
    reload();
  }, [load, reload]);

  const handleDelete = () => {
    if (!selected) return;
    service.handleDelete({ original: { id: selected.id } } as unknown as Row<unknown>, () => {
      setSelected(null);
      refreshAll();
    });
  };

  const base = `/${locale}${Routes.Project}/${projectId}`;

  return (
    <ProjectSection title={t("Form.Stages")} onAdd={openOpsModal} addLabel={t("Form.AddStage")}>
      <Grid container spacing={2}>
        {stages === null ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, xl: 4 }}>
              <Skeleton variant="rounded" height={150} />
            </Grid>
          ))
        ) : stages.length === 0 ? (
          <Grid size={12}>
            <Alert severity="info">{t("Project.NoStagesYet")}</Alert>
          </Grid>
        ) : (
          stages.map((stage) => (
            <Grid key={stage.id} size={{ xs: 12, sm: 6, xl: 4 }}>
              <StageCard
                data={stage}
                blocksHref={`${base}/blocks?stageId=${stage.id}`}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={() => service.handleEdit({ original: { id: stage.id } } as unknown as Row<unknown>)}
                onDelete={() => setSelected(stage)}
              />
            </Grid>
          ))
        )}
      </Grid>

      {selected && (
        <OpsPageFormDeleteDialog
          deleteModalVisible
          deleteModalProps={{ info: t("DeleteModal.InfoWithName", { name: selected.name ?? `#${selected.id}` }) }}
          handleDeleteModalClose={() => setSelected(null)}
          handleDelete={handleDelete}
        />
      )}

      {opsModalVisible && <Form opsService={service} projectId={projectId} succesCallback={refreshAll} />}
    </ProjectSection>
  );
}
