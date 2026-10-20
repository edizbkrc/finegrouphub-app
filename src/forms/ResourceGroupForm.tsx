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

/** Namespace altındaki içerik grubu. Namespace yalnızca oluştururken seçilir. */
export default function ResourceGroupForm({ opsService }: { opsService: IOpsTableService<unknown> }) {
  const t = useTranslations();

  const scheme: IFormItem[] = [
    {
      name: "namespaceId",
      label: "NameSpace",
      type: FormItemTypeEnum.AUTO_COMPLETE,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: { required: t("Form.Required") },
      handleDisabled: (isEdit) => !!isEdit,
      autoCompleteProps: { lookUpParams: lookup("Namespace"), getDefaultValue: navigationDefault("namespace") },
    },
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
    {
      name: "description",
      label: "Description",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      multiLine: true,
      rows: 3,
      registerOptions: { maxLength: { value: 1000, message: t("Form.MaxLength", { max: 1000 }) } },
    },
  ];

  return (
    <OpsForm
      url={ApiRoutes.ResourceGroupDetail}
      opsService={opsService}
      scheme={scheme}
      pageName={OpsPageNames.ResourceGroupManagement}
      title={t("Modal.ResourceGroupCreate")}
      editTitle={t("Modal.ResourceGroupDetail")}
      // Güncelleme komutu namespace değişikliğini desteklemiyor.
      getDeletedPropertyNames={(_, apiData) => (apiData ? ["namespaceId"] : [])}
    />
  );
}
