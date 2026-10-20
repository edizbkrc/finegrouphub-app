"use client";

import { useTranslations } from "next-intl";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsForm from "@common/form/OpsForm";
import { OpsPageNames } from "@enums/OpsPageNames";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormItem } from "@common/types/IFormItem";
import type { IOpsTableService } from "@opsTable/types/IOpsTableService";

export default function ExpenseRevenueCategoryForm({ opsService }: { opsService: IOpsTableService<unknown> }) {
  const t = useTranslations();

  const scheme: IFormItem[] = [
    {
      name: "name",
      label: "Name",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: {
        required: t("Form.Required"),
        maxLength: { value: 100, message: t("Form.MaxLength", { max: 100 }) },
      },
    },
  ];

  return (
    <OpsForm
      url={ApiRoutes.ExpenseRevenueCategoryDetail}
      opsService={opsService}
      scheme={scheme}
      pageName={OpsPageNames.ExpenseRevenueCategoryManagement}
      title={t("Modal.ExpenseRevenueCategoryCreate")}
      editTitle={t("Modal.ExpenseRevenueCategoryDetail")}
    />
  );
}
