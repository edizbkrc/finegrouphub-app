"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { Row } from "@tanstack/react-table";
import { Grid } from "@mui/material";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { useOpsModal } from "@hooks/useOpsModal";
import OpsPageFormDeleteDialog from "@common/page/OpsPageFormDeleteDialog";
import NotFoundComponent from "@components/NotFoundComponent";
import FineImageItem from "@components/FineImageItem";
import FineImageItemSkeleton from "@components/FineImageItemSkeleton";
import { useProject } from "@/features/project/ProjectContext";
import { useProjectTable } from "@/features/project/useProjectTable";
import ProjectSection from "@/features/project/ProjectSection";

const Form = dynamic(() => import("@forms/project/FloorTemplateForm"));

interface IFloorTemplateItem {
  id: number;
  name?: string;
  floorPlanImage?: { url?: string | null } | null;
}

/** Prod hub gibi: kat planı görselli kart ızgarası + modal ekle/düzenle. */
export default function Page() {
  const t = useTranslations();
  const { projectId } = useProject();
  const { opsModalVisible, openOpsModal } = useOpsModal();
  const [list, setList] = useState<IFloorTemplateItem[] | null>(null);
  const [selected, setSelected] = useState<IFloorTemplateItem | null>(null);

  const service = useProjectTable(ApiRoutes.FloorTemplates, ApiRoutes.FloorTemplateDetail, "floorTemplateId", projectId);

  const load = useCallback(() => {
    axiosInstance
      .patch(ApiRoutes.FloorTemplates, { pageNumber: 1, rowCount: 1000, projectId }, { withoutToast: true })
      .then((res) => {
        if (res?.data?.isSuccess) setList((res.data.data as IFloorTemplateItem[]) || []);
        else setList([]);
      })
      .catch(() => setList([]));
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
    <ProjectSection title={t("Form.FloorPlanDefinition")} onAdd={openOpsModal} addLabel={t("Button.AddNew")}>
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        {list === null ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Grid key={index} size={{ xs: 12, sm: 12, md: 6, lg: 4 }}>
              <FineImageItemSkeleton />
            </Grid>
          ))
        ) : list.length > 0 ? (
          list.map((item) => (
            <Grid key={item.id} size={{ xs: 12, sm: 12, md: 6, lg: 4 }}>
              <FineImageItem
                name={item.name}
                imageSrc={item.floorPlanImage?.url || undefined}
                editOnClick={() => {
                  service.handleEdit({ original: { id: item.id } } as unknown as Row<unknown>);
                }}
                deleteOnClick={() => setSelected(item)}
              />
            </Grid>
          ))
        ) : (
          <Grid size={12}>
            <NotFoundComponent />
          </Grid>
        )}
      </Grid>

      {selected && (
        <OpsPageFormDeleteDialog
          deleteModalVisible
          deleteModalProps={{
            title: t("DeleteModal.Title"),
            info: t("DeleteModal.InfoWithName", { name: selected.name || "" }),
          }}
          handleDeleteModalClose={() => setSelected(null)}
          handleDelete={handleDelete}
        />
      )}

      {opsModalVisible && <Form opsService={service} projectId={projectId} succesCallback={load} />}
    </ProjectSection>
  );
}
