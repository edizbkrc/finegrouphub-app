"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { Row } from "@tanstack/react-table";
import { Alert, Button, Grid } from "@mui/material";
import CollectionsIcon from "@mui/icons-material/Collections";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { Routes } from "@enums/Routes";
import { OpsPageNames } from "@enums/OpsPageNames";
import { useOpsModal } from "@hooks/useOpsModal";
import { usePageInformation } from "@hooks/usePageInformation";
import OpsPageFormDeleteDialog from "@common/page/OpsPageFormDeleteDialog";
import FineImageItem from "@components/FineImageItem";
import FineImageItemSkeleton from "@components/FineImageItemSkeleton";
import { useProject } from "@/features/project/ProjectContext";
import { useProjectTable } from "@/features/project/useProjectTable";
import ProjectSection from "@/features/project/ProjectSection";

const Form = dynamic(() => import("@forms/project/GalleryItemForm"));
const MultiGalleryUploadDialog = dynamic(() => import("@/features/project/gallery/MultiGalleryUploadDialog"));

interface IGalleryItem {
  id: number;
  displayOrder?: number;
  image?: { url?: string | null } | null;
  group?: { id: number; name?: string } | null;
}

/**
 * Galeri görselleri: kart ızgarası + tekli ekleme/düzenleme + çoklu yükleme.
 * Gruplar ayrı sayfadadır (`/gallery-groups`); production'daki gibi buradan bağlantı verilir.
 */
export default function GalleryPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { projectId } = useProject();
  const { opsModalVisible, openOpsModal } = useOpsModal();
  const pageInfo = usePageInformation(OpsPageNames.ProjectOperationManagement);
  const canCreate = !!(pageInfo?.hasCreate && pageInfo?.userCanCreate);

  const [items, setItems] = useState<IGalleryItem[] | null>(null);
  const [selected, setSelected] = useState<IGalleryItem | null>(null);
  const [multiOpen, setMultiOpen] = useState(false);

  // Düzenleme (detay çekme) ve silme TableService üzerinden; liste ise kart ızgarası için ayrıca çekilir.
  const service = useProjectTable(ApiRoutes.GalleryItems, ApiRoutes.GalleryItemDetail, "galleryItemId", projectId);

  const load = useCallback(() => {
    // Liste isteği düz gövdede `projectId` ister (iç içe filtre değil).
    axiosInstance
      .patch(ApiRoutes.GalleryItems, { pageNumber: 1, rowCount: 1000, projectId }, { withoutToast: true })
      .then((res) => {
        const rows = (res?.data?.data as IGalleryItem[] | undefined) ?? [];
        // Sıralama istemcide: API sıralama alanı adına bağımlı kalmayalım.
        setItems([...rows].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
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
    <ProjectSection
      title={t("Form.Gallery")}
      onAdd={openOpsModal}
      addLabel={t("Button.AddNew")}
      right={
        <>
          <Button component={Link} href={`/${locale}${Routes.Project}/${projectId}/gallery-groups`} variant="outlined" color="tertiary" startIcon={<CollectionsIcon />} data-cy="gallery-groups-link">
            {t("Form.GalleryGroups")}
          </Button>
          {canCreate && (
            <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => setMultiOpen(true)} data-cy="gallery-multi-upload">
              {t("Button.MultipleUpload")}
            </Button>
          )}
        </>
      }
    >
      <Grid container spacing={2}>
        {items === null ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Grid key={index} size={{ xs: 12, md: 6, xl: 4 }}>
              <FineImageItemSkeleton />
            </Grid>
          ))
        ) : items.length === 0 ? (
          <Grid size={12}>
            <Alert severity="info">{t("Project.NoGalleryItems")}</Alert>
          </Grid>
        ) : (
          items.map((item) => (
            <Grid key={item.id} size={{ xs: 12, md: 6, xl: 4 }}>
              <FineImageItem
                name={item.group?.name || `#${item.id}`}
                imageSrc={item.image?.url ?? undefined}
                chipList={[`${t("Form.Order")}: ${item.displayOrder ?? 0}`]}
                editText={t("Modal.EditGallery")}
                editOnClick={() => service.handleEdit({ original: { id: item.id } } as unknown as Row<unknown>)}
                deleteOnClick={() => setSelected(item)}
              />
            </Grid>
          ))
        )}
      </Grid>

      {selected && (
        <OpsPageFormDeleteDialog
          deleteModalVisible
          deleteModalProps={{ info: t("DeleteModal.InfoWithName", { name: selected.group?.name || `#${selected.id}` }) }}
          handleDeleteModalClose={() => setSelected(null)}
          handleDelete={handleDelete}
        />
      )}

      {multiOpen && <MultiGalleryUploadDialog open projectId={projectId} onClose={() => setMultiOpen(false)} onSuccess={load} />}

      {opsModalVisible && <Form opsService={service} projectId={projectId} succesCallback={load} />}
    </ProjectSection>
  );
}
