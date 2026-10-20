"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { ApiRoutes } from "@network/ApiRoutes";
import { usePageInformation } from "@hooks/usePageInformation";
import OpsPageForm from "@common/page/OpsPageForm";
import { OpsPageNames } from "@enums/OpsPageNames";
import { Routes } from "@enums/Routes";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import { OpsFileTypeEnum } from "@common/enums/OpsFileTypeEnum";
import type { IOpsPageFormItem } from "@common/types/IOpsPageFormItem";
import { useProject } from "@/features/project/ProjectContext";
import ProjectFeatureSpecs from "@/features/project/ProjectFeatureSpecs";
import ProjectStagesSection from "@/features/project/ProjectStagesSection";
import ProjectStateDrawer from "@/features/project/ProjectStateDrawer";
import ProjectAddressList from "@forms/helpers/ProjectAddressList";
import type { IFeatureSpecification } from "@/features/offer/types";

/**
 * Proje genel bilgileri — production hub proje detay alanlarıyla hizalı.
 * Özet kartları (durum, firma, tarihler) ProjectShell'deki şeritte gösterilir;
 * burada yalnızca form, etap bölümü ve teknik özellikler kalır.
 */
export default function ProjectGeneralForm() {
  const t = useTranslations();
  const locale = useLocale();
  const { projectId, project, reload } = useProject();
  const [drawerVisible, setDrawerVisible] = useState(false);
  // Durum güncelleme izni production'daki gibi sayfa ek aksiyonundan okunur.
  const pageInfo = usePageInformation(OpsPageNames.ProjectManagement);
  const canUpdateState = !!pageInfo?.additionalActions?.find((action) => action?.actionName === "UpdateProjectState");

  if (!project) return null;

  const features = (project.featureSpecifications as IFeatureSpecification[] | undefined) ?? [];

  // Dijital maket (Fine3D) — NEXT_PUBLIC_FINE3D_URL yerelde http://localhost:3001.
  const fine3dBase = process.env.NEXT_PUBLIC_FINE3D_URL?.trim();
  const tenantId =
    (typeof project.company?.id === "string" && project.company.id) ||
    (typeof project.companyId === "string" && project.companyId) ||
    null;
  const fine3dUrl =
    fine3dBase && tenantId && project.slug
      ? `${fine3dBase.replace(/\/$/, "")}/${locale}/${encodeURIComponent(tenantId)}/${encodeURIComponent(project.slug)}`
      : null;

  // Sil / Kaydet (maxHeight 40) ile aynı satır yüksekliği — size=large (46px) onları şişiriyordu.
  const headerActionSx = {
    minHeight: "40px",
    maxHeight: "40px",
    height: "40px",
    whiteSpace: "nowrap",
    flexShrink: 0,
    mr: [0, 2],
    mt: [2, 0],
    px: 2,
  } as const;

  const renderRightHeader = () => (
    <>
      {fine3dUrl && (
        <Button
          variant="contained"
          disableElevation
          color="tertiary"
          startIcon={<OpenInNewIcon fontSize="small" />}
          onClick={() => window.open(fine3dUrl, "_blank", "noopener,noreferrer")}
          data-cy="project-fine3d"
          title={fine3dUrl}
          sx={headerActionSx}
        >
          {t("Project.DigitalModel")}
        </Button>
      )}
      {canUpdateState && (
        <Button
          variant="contained"
          disableElevation
          color="tertiary"
          startIcon={<AutorenewIcon fontSize="small" />}
          onClick={() => setDrawerVisible(true)}
          data-cy="project-state-update"
          sx={headerActionSx}
        >
          {t("Form.StatusUpdate")}
        </Button>
      )}
    </>
  );

  const schema: IOpsPageFormItem[] = [
    {
      name: t("Offer.ProjectInfo"),
      surface: "flat",
      gridSize: { xs: 12 },
      schema: [
        {
          name: "name",
          label: "ProjectName",
          type: FormItemTypeEnum.TEXT,
          visibility: FormItemVisibilityEnum.Both,
          gridSize: { xs: 12, md: 6 },
          registerOptions: { required: t("Form.Required"), maxLength: { value: 250, message: t("Form.MaxLength", { max: 250 }) } },
        },
        {
          name: "slogan",
          label: "Slogan",
          type: FormItemTypeEnum.TEXT,
          visibility: FormItemVisibilityEnum.Both,
          gridSize: { xs: 12, md: 6 },
          registerOptions: { maxLength: { value: 500, message: t("Form.MaxLength", { max: 500 }) } },
        },
        { name: "displayOrder", label: "Order", type: FormItemTypeEnum.NUMBER, visibility: FormItemVisibilityEnum.Both, gridSize: { xs: 12, md: 6 }, allowNegative: true },
      ],
    },
    {
      // Etap kartları yalnızca mevcut projede anlamlı; form kaydıyla ilgisi olmadığından sadece Edit'te çizilir.
      gridSize: { xs: 12 },
      renderComponentVisiblitity: FormItemVisibilityEnum.Edit,
      renderComponent: () => <ProjectStagesSection projectId={projectId} />,
    },
    {
      name: t("Offer.ImageInfo"),
      surface: "flat",
      gridSize: { xs: 12, md: 6 },
      schema: [
        { name: "image", label: "UploadLogo", type: FormItemTypeEnum.S3_IMAGE, visibility: FormItemVisibilityEnum.Both },
        { name: "coverImage", label: "UploadCoverImage", type: FormItemTypeEnum.S3_IMAGE, visibility: FormItemVisibilityEnum.Both },
      ],
    },
    {
      name: t("Form.UploadFile"),
      surface: "flat",
      gridSize: { xs: 12, md: 6 },
      schema: [
        {
          name: "music",
          label: "MusicFile",
          type: FormItemTypeEnum.FILE,
          fileType: OpsFileTypeEnum.Audio,
          visibility: FormItemVisibilityEnum.Both,
        },
        {
          name: "documents",
          label: "Documents",
          type: FormItemTypeEnum.FILE,
          fileMultiple: true,
          visibility: FormItemVisibilityEnum.Both,
        },
      ],
    },
    {
      name: t("Offer.TemaInfo"),
      surface: "flat",
      gridSize: { xs: 12 },
      schema: [
        { name: "pinned", label: "Pinned", type: FormItemTypeEnum.SWITCH, visibility: FormItemVisibilityEnum.Both, gridSize: { xs: 12, md: 4 } },
        { name: "featured", label: "Featured", type: FormItemTypeEnum.SWITCH, visibility: FormItemVisibilityEnum.Both, gridSize: { xs: 12, md: 4 } },
        { name: "showUnitPricesInFine3d", label: "ShowUnitPricesInFine3d", type: FormItemTypeEnum.SWITCH, visibility: FormItemVisibilityEnum.Both, gridSize: { xs: 12, md: 4 } },
        {
          name: "startMode",
          label: "ModeStart",
          type: FormItemTypeEnum.AUTO_COMPLETE,
          visibility: FormItemVisibilityEnum.Both,
          gridSize: { xs: 12, md: 6 },
          autoCompleteProps: {
            enumName: "PresentationType",
            getDefaultValue: (apiData) => {
              const value = (apiData as { startMode?: number })?.startMode;
              return value != null ? { id: value, title: t(`PresentationType.${value}`) } : null;
            },
          },
        },
        {
          name: "config.muiThemeObject",
          label: "ThemeObject",
          type: FormItemTypeEnum.TEXT,
          multiLine: true,
          rows: 4,
          visibility: FormItemVisibilityEnum.Both,
          gridSize: { xs: 12 },
        },
        {
          name: "config.canvasConfig",
          label: "CanvasConfig",
          type: FormItemTypeEnum.TEXT,
          multiLine: true,
          rows: 4,
          visibility: FormItemVisibilityEnum.Both,
          gridSize: { xs: 12 },
        },
        {
          name: "config.htmlTemplateForPdfExports",
          label: "Template",
          type: FormItemTypeEnum.TEXT,
          multiLine: true,
          rows: 4,
          visibility: FormItemVisibilityEnum.Both,
          gridSize: { xs: 12 },
        },
      ],
    },
    {
      name: t("Form.AddressInfo"),
      surface: "flat",
      gridSize: { xs: 12 },
      renderComponentVisiblitity: FormItemVisibilityEnum.Both,
      renderComponent: (apiData, formState) => <ProjectAddressList apiData={apiData} formState={formState} />,
    },
    {
      gridSize: { xs: 12 },
      renderComponentVisiblitity: FormItemVisibilityEnum.Edit,
      renderComponent: () => <ProjectFeatureSpecs features={features} />,
    },
  ];

  return (
    <>
      <OpsPageForm
        data={project}
        schema={schema}
        pageName={OpsPageNames.ProjectManagement}
        endpoint={ApiRoutes.ProjectDetail}
        deletePropertyName="projectId"
        lastDisabledRowId={0}
        succesCallback={() => reload()}
        // config tek jsonb; API (UpdateFineProjectHandler) gelen değerle BÜTÜNÜYLE değiştiriyor.
        // Formda yalnız üç config alanı var, diff ise apiData.config'teki ama formda olmayan
        // anahtarları (mobileViewMode, unitAreaFields) "değişmiş" sayıp config'i bu üç alanla
        // gönderiyordu → mobileViewMode varsayılana dönüyordu. Mevcut config'i taban alıp form
        // değerlerini üstüne yayıyoruz. unitAreaFields için API'de ayrıca koruma var; bu ikinci kalkan.
        getDefaultValues={(key, apiData) => (key === "config" ? ((apiData?.config as Record<string, any> | null) ?? {}) : null)}
        pageHeaderProps={{
          title: t("Project.General"),
          editTitle: t("Project.General"),
          showInfoButton: true,
          goBackRouteName: Routes.Projects,
          renderRightComponent: renderRightHeader,
        }}
      />
      {drawerVisible && (
        <ProjectStateDrawer
          isOpen={drawerVisible}
          projectId={projectId}
          currentState={project.state}
          handleClose={(isRefresh) => {
            setDrawerVisible(false);
            // Durum değişince şerit ve başlık chip'i güncellensin diye bağlam yeniden yüklenir.
            if (isRefresh) reload();
          }}
        />
      )}
    </>
  );
}
