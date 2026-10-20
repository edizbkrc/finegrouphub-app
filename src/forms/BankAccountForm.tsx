"use client";

import { useTranslations } from "next-intl";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsForm from "@common/form/OpsForm";
import { OpsPageNames } from "@enums/OpsPageNames";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormItem } from "@common/types/IFormItem";
import type { IOpsTableService } from "@opsTable/types/IOpsTableService";

export default function BankAccountForm({ opsService }: { opsService: IOpsTableService<unknown> }) {
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
      name: "iban",
      label: "Iban",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: {
        required: t("Form.Required"),
        maxLength: { value: 34, message: t("Form.MaxLength", { max: 34 }) },
      },
    },
    {
      name: "branchName",
      label: "BranchName",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: {
        maxLength: { value: 250, message: t("Form.MaxLength", { max: 250 }) },
      },
    },
    {
      name: "isActive",
      label: "Active",
      type: FormItemTypeEnum.SWITCH,
      visibility: FormItemVisibilityEnum.Both,
      defaultValue: true,
    },
  ];

  return (
    <OpsForm
      url={ApiRoutes.BankAccountDetail}
      opsService={opsService}
      scheme={scheme}
      pageName={OpsPageNames.BankAccountManagement}
      title={t("BankAccountManagement.Create")}
      editTitle={t("BankAccountManagement.Detail")}
    />
  );
}
