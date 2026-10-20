"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import { ApiRoutes } from "@network/ApiRoutes";
import { Routes } from "@enums/Routes";
import { useOpsModal } from "@hooks/useOpsModal";
import { OpsPageNames } from "@enums/OpsPageNames";
import OpsTableProvider from "@opsTable/components/OpsTableProvider";
import { useProject } from "@/features/project/ProjectContext";
import { useProjectTable } from "@/features/project/useProjectTable";
import ProjectSection from "@/features/project/ProjectSection";

const Form = dynamic(() => import("@forms/project/GalleryGroupForm"));

export default function Page() {
  const t = useTranslations();
  const locale = useLocale();
  const { projectId } = useProject();
  const { opsModalVisible, openOpsModal } = useOpsModal();
  const service = useProjectTable(ApiRoutes.GalleryGroups, ApiRoutes.GalleryGroupDetail, "galleryGroupId", projectId);

  return (
    <ProjectSection
      title={t("Form.GalleryGroups")}
      onAdd={openOpsModal}
      addLabel={t("Modal.GalleryGroupCreate")}
      right={
        // Gruplar galeri görsellerinin alt sayfasıdır; kullanıcı galeriye tek tıkla dönebilmeli.
        <Button component={Link} href={`/${locale}${Routes.Project}/${projectId}/gallery`} variant="outlined" color="tertiary" startIcon={<ArrowBack />} data-cy="gallery-back">
          {t("Form.Gallery")}
        </Button>
      }
    >
      <OpsTableProvider
        opsService={service}
        pageName={OpsPageNames.ProjectOperationManagement}
        tableProps={{ showEditIcon: true, showDeleteIcon: true, lastDisabledRowId: 0 }}
      />
      {opsModalVisible && <Form opsService={service} projectId={projectId} />}
    </ProjectSection>
  );
}
