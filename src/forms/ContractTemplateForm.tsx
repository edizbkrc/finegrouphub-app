"use client";

import { useTranslations } from "next-intl";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsForm from "@common/form/OpsForm";
import { OpsPageNames } from "@enums/OpsPageNames";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormItem } from "@common/types/IFormItem";
import type { IOpsTableService } from "@opsTable/types/IOpsTableService";

export default function ContractTemplateForm({ opsService }: { opsService: IOpsTableService<unknown> }) {
  const t = useTranslations();

  const scheme: IFormItem[] = [
    {
      name: "name",
      label: "Name",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: {
        required: t("Form.Required"),
        maxLength: { value: 250, message: t("Form.MaxLength", { max: 250 }) },
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
        maxLength: { value: 1000, message: t("Form.MaxLength", { max: 1000 }) },
      },
    },
    {
      name: "text",
      label: "ContractText",
      type: FormItemTypeEnum.Editor,
      visibility: FormItemVisibilityEnum.Both,
      gridSize: 12,
    },
  ];

  return (
    <OpsForm
      url={ApiRoutes.ContractTemplateDetail}
      opsService={opsService}
      scheme={scheme}
      pageName={OpsPageNames.ContractTemplateManagement}
      title={t("ContractTemplateManagement.Create")}
      editTitle={t("ContractTemplateManagement.Detail")}
    />
  );
}
