"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { Row } from "@tanstack/react-table";
import { Alert, Grid, Skeleton } from "@mui/material";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { OpsPageNames } from "@enums/OpsPageNames";
import { useOpsModal } from "@hooks/useOpsModal";
import { usePageInformation } from "@hooks/usePageInformation";
import OpsPageFormDeleteDialog from "@common/page/OpsPageFormDeleteDialog";
import { useProject } from "@/features/project/ProjectContext";
import { useProjectTable } from "@/features/project/useProjectTable";
import ProjectSection from "@/features/project/ProjectSection";
import UnitStateCard, { type IUnitStateCardData } from "@/features/project/UnitStateCard";

const Form = dynamic(() => import("@forms/project/UnitStateForm"));

/**
 * Durum tanımları: kart ızgarası — renk her kartta büyük görünür.
 * Tablo satırında hex okunmuyordu; kart + renk şeridi ile düzelttik.
 */
export default function Page() {
  const t = useTranslations();
  const { projectId } = useProject();
  const { opsModalVisible, openOpsModal } = useOpsModal();
  const pageInfo = usePageInformation(OpsPageNames.ProjectOperationManagement);
  const canEdit = !!(pageInfo?.hasEdit && pageInfo?.userCanEdit);
  const canDelete = !!(pageInfo?.hasDelete && pageInfo?.userCanDelete);

  const [items, setItems] = useState<IUnitStateCardData[] | null>(null);
  const [selected, setSelected] = useState<IUnitStateCardData | null>(null);

  const service = useProjectTable(ApiRoutes.UnitStates, ApiRoutes.UnitStateDetail, "unitStateId", projectId);

  const load = useCallback(() => {
    axiosInstance
      .patch(ApiRoutes.UnitStates, { pageNumber: 1, rowCount: 1000, projectId }, { withoutToast: true })
      .then((res) => {
        setItems((res?.data?.data as IUnitStateCardData[] | undefined) ?? []);
      })
      .catch(() => setItems([]));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = () => {
    if (!selected) return;
    service.handleDelete({ original: { id: selected.id } } as unknown as Row<unknown>, () => {
      setSelected(null);
      load();
    });
  };

  return (
    <ProjectSection title={t("Form.StateDefinition")} onAdd={openOpsModal} addLabel={t("Modal.UnitStateCreate")}>
      <Grid container spacing={2}>
        {items === null ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Skeleton variant="rounded" height={168} />
            </Grid>
          ))
        ) : items.length === 0 ? (
          <Grid size={12}>
            <Alert severity="info">{t("Form.NotFound")}</Alert>
          </Grid>
        ) : (
          items.map((item) => (
            <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <UnitStateCard
                data={item}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={() => service.handleEdit({ original: { id: item.id } } as unknown as Row<unknown>)}
                onDelete={() => setSelected(item)}
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

      {opsModalVisible && <Form opsService={service} projectId={projectId} succesCallback={load} />}
    </ProjectSection>
  );
}
