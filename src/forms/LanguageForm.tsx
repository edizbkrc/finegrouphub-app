"use client";

import { useTranslations } from "next-intl";
import { ApiRoutes } from "@network/ApiRoutes";
import { useOpsModal } from "@hooks/useOpsModal";
import OpsForm from "@common/form/OpsForm";
import { OpsPageNames } from "@enums/OpsPageNames";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormItem } from "@common/types/IFormItem";
import type { IOpsTableService } from "@opsTable/types/IOpsTableService";

/**
 * Diller yalnızca güncellenebilir (oluşturma/silme yok — 15 dil sabit seed).
 * Satır tıklaması `useTableData: true` ile tablo verisini doğrudan kullanır,
 * ayrı bir detay GET'i yoktur (API'de böyle bir uç da yok).
 */
export default function LanguageForm({ opsService }: { opsService: IOpsTableService<unknown> }) {
  const t = useTranslations();
  const { opsModalData } = useOpsModal();
  const data = opsModalData as { name?: string; code?: string } | null;

  const scheme: IFormItem[] = [
    {
      name: "isDefault",
      label: "IsDefault",
      type: FormItemTypeEnum.SWITCH,
      visibility: FormItemVisibilityEnum.Edit,
    },
    {
      name: "supported",
      label: "Supported",
      type: FormItemTypeEnum.SWITCH,
      visibility: FormItemVisibilityEnum.Edit,
    },
  ];

  return (
    <OpsForm
      url={ApiRoutes.LanguageDetail}
      opsService={opsService}
      scheme={scheme}
      pageName={OpsPageNames.LanguageManagement}
      title={t("Modal.LanguageDetail")}
      editTitle={data?.name ? `${data.name} (${data.code})` : t("Modal.LanguageDetail")}
      allowDetailRefetch={false}
    />
  );
}
