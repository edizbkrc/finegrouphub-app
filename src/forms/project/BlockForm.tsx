"use client";

import { useTranslations } from "next-intl";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsForm from "@common/form/OpsForm";
import { OpsPageNames } from "@enums/OpsPageNames";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormItem } from "@common/types/IFormItem";
import type { IOpsTableService } from "@opsTable/types/IOpsTableService";

/**
 * Blok bilgileri (yalnızca düzenleme): ad, daire sayısı ve iki görsel.
 * Oluşturma, katlarla birlikte tek adımda BlockCreateDialog'dan yapılır; katlar ise
 * blok sayfasında yönetilir. Bu yüzden form yalnızca `PUT blocks/block` gövdesini besler.
 */
export default function BlockForm({
  opsService,
  succesCallback,
}: {
  opsService: IOpsTableService<unknown>;
  succesCallback?: () => void;
}) {
  const t = useTranslations();

  const scheme: IFormItem[] = [
    {
      name: "name",
      label: "BlockName",
      // Blok adı çok dilli değil: UpdateBlockCommand.name düz string.
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Edit,
      gridSize: { xs: 12, md: 8 },
      registerOptions: { required: t("Form.Required"), maxLength: { value: 50, message: t("Form.MaxLength", { max: 50 }) } },
    },
    {
      name: "apartmentCount",
      label: "ApartmentCount",
      type: FormItemTypeEnum.NUMBER,
      visibility: FormItemVisibilityEnum.Edit,
      gridSize: { xs: 12, md: 4 },
      defaultValue: 0,
    },
    { name: "layoutPlanImage", label: "UploadBlockLocation", type: FormItemTypeEnum.S3_IMAGE, visibility: FormItemVisibilityEnum.Edit },
    { name: "positionImage", label: "UploadPositionImage", type: FormItemTypeEnum.S3_IMAGE, visibility: FormItemVisibilityEnum.Edit },
  ];

  return (
    <OpsForm
      url={ApiRoutes.BlockDetail}
      opsService={opsService}
      scheme={scheme}
      pageName={OpsPageNames.ProjectOperationManagement}
      title={t("Modal.EditBlock")}
      editTitle={t("Modal.EditBlock")}
      lastDisabledRowId={0}
      // Blok sayfası kendi verisini `succesCallback` ile yeniler; modalı yeniden açmaya gerek yok.
      allowDetailRefetch={false}
      succesCallback={succesCallback}
    />
  );
}
