"use client";

import { useTranslations } from "next-intl";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsForm from "@common/form/OpsForm";
import { OpsPageNames } from "@enums/OpsPageNames";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormItem } from "@common/types/IFormItem";
import type { IOpsTableService } from "@opsTable/types/IOpsTableService";

/** Hazır özellik paketi (örn. "Herşey Dahil"): teklif oluştururken şablon olarak seçilir. */
export default function FineFeatureGroupForm({ opsService }: { opsService: IOpsTableService<unknown> }) {
  const t = useTranslations();

  const scheme: IFormItem[] = [
    {
      name: "name",
      label: "Name",
      type: FormItemTypeEnum.LANGUAGE_TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: { required: t("Form.Required"), maxLength: { value: 250, message: t("Form.MaxLength", { max: 250 }) } },
    },
    {
      name: "description",
      label: "Description",
      type: FormItemTypeEnum.LANGUAGE_TEXT,
      visibility: FormItemVisibilityEnum.Both,
      multiLine: true,
      rows: 2,
      registerOptions: { maxLength: { value: 2000, message: t("Form.MaxLength", { max: 2000 }) } },
    },
    { name: "displayOrder", label: "Order", type: FormItemTypeEnum.NUMBER, visibility: FormItemVisibilityEnum.Both, defaultValue: 0, allowNegative: true },
    {
      name: "specifications",
      label: "Features",
      type: FormItemTypeEnum.FEATURE_SPECIFICATIONS,
      visibility: FormItemVisibilityEnum.Both,
      triggerValue: "group",
    },
  ];

  return (
    <OpsForm
      url={ApiRoutes.FeatureGroupDetail}
      opsService={opsService}
      scheme={scheme}
      pageName={OpsPageNames.FeatureGroupManagement}
      title={t("Modal.FeatureGroupCreate")}
      editTitle={t("Modal.FeatureGroupDetail")}
      lastDisabledRowId={0}
    />
  );
}
