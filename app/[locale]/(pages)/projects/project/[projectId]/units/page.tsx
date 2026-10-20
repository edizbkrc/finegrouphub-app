"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Alert, Button } from "@mui/material";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import PinOutlinedIcon from "@mui/icons-material/PinOutlined";
import { ApiRoutes } from "@network/ApiRoutes";
import { Routes } from "@enums/Routes";
import { useOpsModal } from "@hooks/useOpsModal";
import { OpsPageNames } from "@enums/OpsPageNames";
import OpsTableProvider from "@opsTable/components/OpsTableProvider";
import { useProject } from "@/features/project/ProjectContext";
import { useProjectTable } from "@/features/project/useProjectTable";
import { useUnitAreaMetadataTransform } from "@/features/project/useUnitAreaFields";
import ProjectSection from "@/features/project/ProjectSection";

const UnitForm = dynamic(() => import("@forms/project/UnitForm"));

/** Projedeki tüm daireler (filtre/sıralama/dışa aktarma). Yeni daire blok sayfasından eklenir. */
export default function UnitsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { projectId } = useProject();
  const { opsModalVisible } = useOpsModal();
  const metadataTransform = useUnitAreaMetadataTransform();
  const service = useProjectTable(ApiRoutes.Units, ApiRoutes.UnitDetail, "unitId", projectId, { deleteKey: "id", metadataTransform });
  const base = `/${locale}${Routes.Project}/${projectId}`;

  return (
    <ProjectSection
      title={t("Project.Units")}
      right={
        <>
          <Button component={Link} href={`${base}/unit-numbers`} variant="outlined" startIcon={<PinOutlinedIcon />} data-cy="units-numbering-link">
            {t("Project.UnitNumbers")}
          </Button>
          <Button component={Link} href={`${base}/units/search`} variant="outlined" color="tertiary" startIcon={<ManageSearchIcon />} data-cy="units-search-link">
            {t("Form.AdvancedUnitSearch")}
          </Button>
        </>
      }
    >
      {/* Ekle butonu yok: daire, kat seçimi gerektirdiği için yalnızca blok sayfasından oluşturulabilir. */}
      <Alert severity="info" sx={{ mb: 2 }}>
        {t("Project.UnitsAddedFromBlock")}{" "}
        <Link href={`${base}/blocks`} style={{ fontWeight: 700 }}>
          {t("Form.Blocks")}
        </Link>
      </Alert>
      <OpsTableProvider
        opsService={service}
        pageName={OpsPageNames.ProjectOperationManagement}
        tableProps={{ showEditIcon: true, showDeleteIcon: true, lastDisabledRowId: 0 }}
      />
      {opsModalVisible && <UnitForm opsService={service} projectId={projectId} />}
    </ProjectSection>
  );
}
