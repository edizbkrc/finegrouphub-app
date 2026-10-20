"use client";

import { useTranslations } from "next-intl";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsForm from "@common/form/OpsForm";
import { OpsPageNames } from "@enums/OpsPageNames";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormItem } from "@common/types/IFormItem";
import type { IOpsTableService } from "@opsTable/types/IOpsTableService";

export default function ContractTemplatePlaceholderForm({ opsService }: { opsService: IOpsTableService<unknown> }) {
  const t = useTranslations();

  const scheme: IFormItem[] = [
    {
      name: "key",
      label: "Key",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: {
        required: t("Form.Required"),
        maxLength: { value: 100, message: t("Form.MaxLength", { max: 100 }) },
      },
    },
    {
      name: "value",
      label: "Value",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: {
        required: t("Form.Required"),
        maxLength: { value: 1000, message: t("Form.MaxLength", { max: 1000 }) },
      },
    },
    {
      name: "description",
      label: "Description",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      multiLine: true,
      rows: 2,
      registerOptions: {
        maxLength: { value: 500, message: t("Form.MaxLength", { max: 500 }) },
      },
    },
  ];

  return (
    <OpsForm
      url={ApiRoutes.ContractTemplatePlaceholderDetail}
      opsService={opsService}
      scheme={scheme}
      pageName={OpsPageNames.ContractTemplatePlaceholderManagement}
      title={t("ContractTemplatePlaceholderManagement.Create")}
      editTitle={t("ContractTemplatePlaceholderManagement.Detail")}
    />
  );
}
