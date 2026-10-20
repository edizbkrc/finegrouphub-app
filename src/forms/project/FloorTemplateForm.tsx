"use client";

import { useTranslations } from "next-intl";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsForm from "@common/form/OpsForm";
import { useOpsModal } from "@hooks/useOpsModal";
import { OpsPageNames } from "@enums/OpsPageNames";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormItem } from "@common/types/IFormItem";
import type { IOpsTableService } from "@opsTable/types/IOpsTableService";

/** Kat şablonu — isim + kat planı görseli (prod hub ile aynı alanlar). */
export default function FloorTemplateForm({
  opsService,
  projectId,
  succesCallback,
}: {
  opsService: IOpsTableService<unknown>;
  projectId: number;
  succesCallback?: () => void;
}) {
  const t = useTranslations();
  const { opsModalData } = useOpsModal();

  const scheme: IFormItem[] = [
    {
      name: "floorPlanImage",
      label: "UploadImage",
      type: FormItemTypeEnum.S3_IMAGE,
      visibility: FormItemVisibilityEnum.Both,
    },
    {
      name: "name",
      label: "TemplateName",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: {
        required: t("Form.Required"),
        maxLength: { value: 250, message: t("Form.MaxLength", { max: 250 }) },
      },
    },
  ];

  return (
    <OpsForm
      url={ApiRoutes.FloorTemplateDetail}
      opsService={opsService}
      scheme={scheme}
      pageName={OpsPageNames.ProjectOperationManagement}
      title={t("Modal.FloorTemplateCreate")}
      editTitle={t("Modal.FloorTemplateDetail")}
      lastDisabledRowId={0}
      getAddExtraData={() => (opsModalData ? undefined : { projectId })}
      succesCallback={succesCallback}
    />
  );
}
