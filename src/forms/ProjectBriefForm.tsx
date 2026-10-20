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
 * Proje ön süreci (brief): tekliften önce müşteriyle yürütülen hazırlık.
 * Notlar `{ content }[]` olarak gider; düzenlemede mevcut notlar (yazan + tarih) görünür.
 * (API alan adı `assinedUserId` — kaynakta da bu yazımla.)
 */
export default function ProjectBriefForm({ opsService }: { opsService: IOpsTableService<unknown> }) {
  const t = useTranslations();

  const scheme: IFormItem[] = [
    {
      name: "projectName",
      label: "ProjectName",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      gridSize: { xs: 12 },
      registerOptions: {
        required: t("Form.Required"),
        maxLength: { value: 250, message: t("Form.MaxLength", { max: 250 }) },
      },
    },
    {
      name: "tenantId",
      label: "Tenant",
      type: FormItemTypeEnum.AUTO_COMPLETE,
      visibility: FormItemVisibilityEnum.Both,
      gridSize: { xs: 12, md: 6 },
      // API'de TenantId opsiyonel (liste boşsa "-" gösterir); müşteri sonradan bağlanabilir.
      autoCompleteProps: { lookUpParams: lookup("Tenant"), getDefaultValue: navigationDefault("tenant") },
    },
    {
      name: "assinedUserId",
      label: "AssignedUser",
      type: FormItemTypeEnum.AUTO_COMPLETE,
      visibility: FormItemVisibilityEnum.Both,
      gridSize: { xs: 12, md: 6 },
      autoCompleteProps: { lookUpParams: lookup("User", ["UserName"]), getDefaultValue: navigationDefault("assinedUser") },
    },
    {
      name: "notes",
      label: "Notes",
      type: FormItemTypeEnum.MultiArrayObjectInput,
      visibility: FormItemVisibilityEnum.Both,
    },
  ];

  return (
    <OpsForm
      url={ApiRoutes.ProjectBriefDetail}
      opsService={opsService}
      scheme={scheme}
      pageName={OpsPageNames.ProjectBriefManagement}
      title={t("Modal.ProjectBriefCreate")}
      editTitle={t("Modal.ProjectBriefDetail")}
      lastDisabledRowId={0}
    />
  );
}
