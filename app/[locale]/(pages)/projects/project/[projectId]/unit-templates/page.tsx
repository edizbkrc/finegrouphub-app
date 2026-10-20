"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { Row } from "@tanstack/react-table";
import { Button, Grid, Stack } from "@mui/material";
import Straighten from "@mui/icons-material/Straighten";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { useOpsModal } from "@hooks/useOpsModal";
import { OpsPageNames } from "@enums/OpsPageNames";
import { usePageInformation } from "@hooks/usePageInformation";
import OpsPageFormDeleteDialog from "@common/page/OpsPageFormDeleteDialog";
import ExcelBulkImport from "@common/excel/ExcelBulkImport";
import NotFoundComponent from "@components/NotFoundComponent";
import FineImageItem from "@components/FineImageItem";
import FineImageItemSkeleton from "@components/FineImageItemSkeleton";
import { buildUnitTemplateScheme } from "@forms/project/unitTemplateScheme";
import { hiddenAreaZeros } from "@features/project/unitAreaFields";
import { useUnitAreaFields, useUnitAreaMetadataTransform } from "@features/project/useUnitAreaFields";
import { useProject } from "@/features/project/ProjectContext";
import { useProjectTable } from "@/features/project/useProjectTable";
import ProjectSection from "@/features/project/ProjectSection";

const Form = dynamic(() => import("@forms/project/UnitTemplateForm"));
const UnitAreaFieldsDialog = dynamic(() => import("@features/project/UnitAreaFieldsDialog"));

interface IUnitTemplateItem {
  id: number;
  name?: string;
  image?: { url?: string | null } | null;
}

/**
 * Eski paneldeki gibi plan görselli kart ızgarası (kullanıcı tablo yerine bunu istedi). Kat
 * Şablonu sayfasıyla aynı desen: kart tıklanınca düzenleme modalı, üç nokta menüsünden sil.
 * Tablo sayfasındaki Alan Adları ve Excel ile toplu ekleme korunur.
 */
export default function Page() {
  const t = useTranslations();
  const { projectId } = useProject();
  const { opsModalVisible, openOpsModal } = useOpsModal();
  const [list, setList] = useState<IUnitTemplateItem[] | null>(null);
  const [selected, setSelected] = useState<IUnitTemplateItem | null>(null);
  const [areaDialogOpen, setAreaDialogOpen] = useState(false);

  const metadataTransform = useUnitAreaMetadataTransform();
  const service = useProjectTable(ApiRoutes.UnitTemplates, ApiRoutes.UnitTemplateDetail, "unitTemplateId", projectId, {
    metadataTransform,
  });
  const areaFields = useUnitAreaFields();
  const scheme = buildUnitTemplateScheme(t, areaFields);
  // Alan adları proje config'inde tutuluyor; yazma yetkisi proje düzenleme izniyle aynı
  // (PUT /v1/projects/project → FineProjectManagement_Update).
  const projectPageInfo = usePageInformation(OpsPageNames.ProjectManagement);
  const canEditProject = !!(projectPageInfo?.hasEdit && projectPageInfo?.userCanEdit);

  const load = useCallback(() => {
    axiosInstance
      .patch(ApiRoutes.UnitTemplates, { pageNumber: 1, rowCount: 1000, projectId }, { withoutToast: true })
      .then((res) => {
        if (res?.data?.isSuccess) setList((res.data.data as IUnitTemplateItem[]) || []);
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
    <ProjectSection
      title={t("Form.ApartmentPlan")}
      onAdd={openOpsModal}
      addLabel={t("Button.AddNew")}
      right={
        <Stack direction="row" spacing={1} alignItems="center">
          {canEditProject && (
            <Button variant="outlined" size="small" startIcon={<Straighten />} onClick={() => setAreaDialogOpen(true)}>
              {t("Button.AreaFieldNames")}
            </Button>
          )}
          <ExcelBulkImport
            scheme={scheme}
            url={ApiRoutes.UnitTemplateDetail}
            onImported={load}
            // Excel'de özellik kolonu yok, burada [] doğru. Gizli alanlar kolon olarak
            // açılmadığı için create gövdesine 0 olarak eklenir.
            extraData={{ projectId, specifications: [], ...hiddenAreaZeros(areaFields) }}
            fileBaseName="mulk-sablonu"
          />
        </Stack>
      }
    >
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
                imageSrc={item.image?.url || undefined}
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
      {areaDialogOpen && (
        <UnitAreaFieldsDialog
          open={areaDialogOpen}
          onClose={() => {
            setAreaDialogOpen(false);
            load();
          }}
        />
      )}
    </ProjectSection>
  );
}
