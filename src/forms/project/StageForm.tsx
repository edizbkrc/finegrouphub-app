"use client";

import { useTranslations } from "next-intl";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsForm from "@common/form/OpsForm";
import { useOpsModal } from "@hooks/useOpsModal";
import { OpsPageNames } from "@enums/OpsPageNames";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormItem } from "@common/types/IFormItem";
import type { IOpsTableService } from "@opsTable/types/IOpsTableService";

/** Etap: çok dilli ad + opsiyonel tarih aralığı. Etap sayısı sipariş özelliğiyle sınırlıdır (API doğrular). */
export default function StageForm({
  opsService,
  projectId,
  succesCallback,
}: {
  opsService: IOpsTableService<unknown>;
  projectId: number;
  succesCallback?: () => void;
}) {
  const t = useTranslations();
  const { opsModalData } = useOpsModal();

  const scheme: IFormItem[] = [
    {
      name: "name",
      label: "StageName",
      type: FormItemTypeEnum.LANGUAGE_TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: { required: t("Form.Required"), maxLength: { value: 100, message: t("Form.MaxLength", { max: 100 }) } },
    },
    { name: "startDate", label: "StartDate", type: FormItemTypeEnum.DATE, visibility: FormItemVisibilityEnum.Both, gridSize: { xs: 12, md: 6 } },
    { name: "endDate", label: "EndDate", type: FormItemTypeEnum.DATE, visibility: FormItemVisibilityEnum.Both, gridSize: { xs: 12, md: 6 } },
    { name: "displayOrder", label: "Order", type: FormItemTypeEnum.NUMBER, visibility: FormItemVisibilityEnum.Both, defaultValue: 0 },
  ];

  return (
    <OpsForm
      url={ApiRoutes.StageDetail}
      opsService={opsService}
      scheme={scheme}
      pageName={OpsPageNames.ProjectOperationManagement}
      title={t("Form.AddStage")}
      editTitle={t("Form.EditStage")}
      lastDisabledRowId={0}
      // Etaplar kart ızgarasında listelenir; kayıttan sonra modalı düzenleme modunda yeniden
      // açmak yerine ızgarayı yenileyip kapatıyoruz.
      allowDetailRefetch={false}
      succesCallback={succesCallback}
      getAddExtraData={() => (opsModalData ? undefined : { projectId })}
    />
  );
}
