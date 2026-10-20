"use client";

import { useTranslations } from "next-intl";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsForm from "@common/form/OpsForm";
import { OpsPageNames } from "@enums/OpsPageNames";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormItem } from "@common/types/IFormItem";
import type { IOpsTableService } from "@opsTable/types/IOpsTableService";

/** CMS namespace'i (örn. bir site). Slug ad'dan sunucuda üretilir. */
export default function NamespaceForm({ opsService }: { opsService: IOpsTableService<unknown> }) {
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
    {
      name: "slug",
      label: "Slug",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Edit,
      inputDisabled: () => true,
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
      url={ApiRoutes.NamespaceDetail}
      opsService={opsService}
      scheme={scheme}
      pageName={OpsPageNames.NamespaceManagement}
      title={t("Modal.NameSpaceCreate")}
      editTitle={t("Modal.NameSpaceDetail")}
      getDeletedPropertyNames={() => ["slug"]}
    />
  );
}
