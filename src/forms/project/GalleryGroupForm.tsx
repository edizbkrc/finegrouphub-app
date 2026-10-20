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

/** Galeri grubu (Dış Mekan, İç Mekan...). Görseller dosya depolaması (S3) ile yüklenir. */
export default function GalleryGroupForm({ opsService, projectId }: { opsService: IOpsTableService<unknown>; projectId: number }) {
  const t = useTranslations();
  const { opsModalData } = useOpsModal();

  const scheme: IFormItem[] = [
    {
      name: "name",
      label: "GroupName",
      type: FormItemTypeEnum.LANGUAGE_TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: { required: t("Form.Required"), maxLength: { value: 100, message: t("Form.MaxLength", { max: 100 }) } },
    },
  ];

  return (
    <OpsForm
      url={ApiRoutes.GalleryGroupDetail}
      opsService={opsService}
      scheme={scheme}
      pageName={OpsPageNames.ProjectOperationManagement}
      title={t("Modal.GalleryGroupCreate")}
      editTitle={t("Modal.GalleryGroupDetail")}
      lastDisabledRowId={0}
      getAddExtraData={() => (opsModalData ? undefined : { projectId })}
    />
  );
}
