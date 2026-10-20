"use client";

import { useTranslations } from "next-intl";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsForm from "@common/form/OpsForm";
import { OpsPageNames } from "@enums/OpsPageNames";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormItem } from "@common/types/IFormItem";
import type { IOpsTableService } from "@opsTable/types/IOpsTableService";
import { lookup, navigationDefault } from "./helpers/formHelpers";

/**
 * Gelir/Gider kaydı. Detay DTO'su kategori/banka/firma bilgisini `{ id, name }`
 * navigasyonları olarak döndürür; form ise `categoryId`, `bankAccountId`,
 * `tenantId` gönderir.
 */
export default function ExpenseRevenueForm({ opsService }: { opsService: IOpsTableService<unknown> }) {
  const t = useTranslations();

  const scheme: IFormItem[] = [
    {
      name: "isExpense",
      label: "Expense",
      type: FormItemTypeEnum.SWITCH,
      visibility: FormItemVisibilityEnum.Both,
      defaultValue: true,
      gridSize: { xs: 12, md: 6 },
    },
    {
      name: "amount",
      label: "Amount",
      type: FormItemTypeEnum.Decimal,
      visibility: FormItemVisibilityEnum.Both,
      gridSize: { xs: 12, md: 6 },
      registerOptions: { required: t("Form.Required") },
    },
    {
      name: "date",
      label: "Date",
      type: FormItemTypeEnum.DATE,
      visibility: FormItemVisibilityEnum.Both,
      gridSize: { xs: 12, md: 6 },
      registerOptions: { required: t("Form.Required") },
    },
    {
      name: "bankAccountId",
      label: "BankAccount",
      type: FormItemTypeEnum.AUTO_COMPLETE,
      visibility: FormItemVisibilityEnum.Both,
      gridSize: { xs: 12, md: 6 },
      registerOptions: { required: t("Form.Required") },
      autoCompleteProps: {
        lookUpParams: lookup("BankAccount"),
        getDefaultValue: navigationDefault("bankAccount"),
      },
    },
    {
      name: "categoryId",
      label: "Category",
      type: FormItemTypeEnum.AUTO_COMPLETE,
      visibility: FormItemVisibilityEnum.Both,
      gridSize: { xs: 12, md: 6 },
      autoCompleteProps: {
        lookUpParams: lookup("ExpenseRevenueCategory"),
        getDefaultValue: navigationDefault("category"),
      },
    },
    {
      name: "tenantId",
      label: "Tenant",
      type: FormItemTypeEnum.AUTO_COMPLETE,
      visibility: FormItemVisibilityEnum.Both,
      gridSize: { xs: 12, md: 6 },
      autoCompleteProps: {
        lookUpParams: lookup("Tenant"),
        getDefaultValue: navigationDefault("tenant"),
      },
    },
    {
      name: "description",
      label: "Description",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      multiLine: true,
      rows: 3,
      registerOptions: {
        maxLength: { value: 1000, message: t("Form.MaxLength", { max: 1000 }) },
      },
    },
  ];

  return (
    <OpsForm
      url={ApiRoutes.ExpenseRevenueDetail}
      opsService={opsService}
      scheme={scheme}
      pageName={OpsPageNames.ExpenseRevenueManagement}
      title={t("Modal.ExpenseRevenueCreate")}
      editTitle={t("Modal.ExpenseRevenueDetail")}
    />
  );
}
