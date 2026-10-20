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
 * CMS içeriği: bir anahtar + dil başına değer. Anahtar ve resource grubu
 * oluşturulduktan sonra değişmez (güncelleme komutu yalnızca çevirileri alır).
 */
export default function ContentForm({ opsService }: { opsService: IOpsTableService<unknown> }) {
  const t = useTranslations();

  const scheme: IFormItem[] = [
    {
      name: "resourceGroupId",
      label: "ResourceGroup",
      type: FormItemTypeEnum.AUTO_COMPLETE,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: { required: t("Form.Required") },
      handleDisabled: (isEdit) => !!isEdit,
      gridSize: { xs: 12, md: 6 },
      autoCompleteProps: { lookUpParams: lookup("ResourceGroup"), getDefaultValue: navigationDefault("resourceGroup") },
    },
    {
      name: "key",
      label: "Key",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      inputDisabled: (isEdit) => !!isEdit,
      gridSize: { xs: 12, md: 6 },
      registerOptions: {
        required: t("Form.Required"),
        maxLength: { value: 250, message: t("Form.MaxLength", { max: 250 }) },
      },
    },
    {
      name: "value",
      label: "Value",
      type: FormItemTypeEnum.LANGUAGE_TEXT,
      visibility: FormItemVisibilityEnum.Both,
      multiLine: true,
      rows: 3,
      registerOptions: { required: t("Form.Required") },
    },
  ];

  return (
    <OpsForm
      url={ApiRoutes.ContentDetail}
      opsService={opsService}
      scheme={scheme}
      pageName={OpsPageNames.ContentManagement}
      title={t("Modal.ContentCreate")}
      editTitle={t("Modal.ContentDetail")}
      getDeletedPropertyNames={(_, apiData) => (apiData ? ["resourceGroupId", "key"] : [])}
    />
  );
}
