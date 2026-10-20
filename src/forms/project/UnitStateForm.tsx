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
import { isProtectedUnitStateKind } from "@/features/project/unitStateKind";

/** Proje içi daire durumu (Uygun, Satıldı...). Renk, Fine3D'de birimin boyanacağı renktir. */
export default function UnitStateForm({
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

  /** Uygun / Satıldı / Rezerve düzenlerken yalnız ad açık kalır. */
  const lockNonName = (isEdit?: boolean, data?: unknown) =>
    !!isEdit && isProtectedUnitStateKind((data as { kind?: number } | null)?.kind);

  const scheme: IFormItem[] = [
    {
      name: "name",
      label: "Name",
      type: FormItemTypeEnum.LANGUAGE_TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: { required: t("Form.Required"), maxLength: { value: 100, message: t("Form.MaxLength", { max: 100 }) } },
    },
    {
      name: "kind",
      label: "StateKind",
      type: FormItemTypeEnum.AUTO_COMPLETE,
      visibility: FormItemVisibilityEnum.Both,
      gridSize: { xs: 12, md: 6 },
      registerOptions: { required: t("Form.Required") },
      handleDisabled: lockNonName,
      hanndleDisabledLabel: (apiData) => {
        const value = (apiData as { kind?: number })?.kind;
        return value ? t(`UnitStateKind.${value}`) : "-";
      },
      autoCompleteProps: {
        enumName: "UnitStateKind",
        getDefaultValue: (apiData) => {
          const value = (apiData as { kind?: number })?.kind;
          return value ? { id: value, title: t(`UnitStateKind.${value}`) } : null;
        },
      },
    },
    {
      name: "color",
      label: "Color",
      type: FormItemTypeEnum.COLOR_PICKER,
      visibility: FormItemVisibilityEnum.Both,
      gridSize: { xs: 12, md: 6 },
      defaultValue: "#4caf50",
      registerOptions: { required: t("Form.Required") },
      handleDisabled: lockNonName,
      hanndleDisabledLabel: (apiData) => String((apiData as { color?: string })?.color ?? "-"),
    },
    {
      name: "filterable",
      label: "Filterable",
      type: FormItemTypeEnum.SWITCH,
      visibility: FormItemVisibilityEnum.Both,
      gridSize: { xs: 12, md: 6 },
      defaultValue: true,
      handleDisabled: lockNonName,
      hanndleDisabledLabel: (apiData) => ((apiData as { filterable?: boolean })?.filterable ? t("Form.Yes") : t("Form.No")),
    },
    {
      name: "isDefault",
      label: "IsDefault",
      type: FormItemTypeEnum.SWITCH,
      visibility: FormItemVisibilityEnum.Both,
      gridSize: { xs: 12, md: 6 },
      handleDisabled: lockNonName,
      hanndleDisabledLabel: (apiData) => ((apiData as { isDefault?: boolean })?.isDefault ? t("Form.Yes") : t("Form.No")),
    },
  ];

  return (
    <OpsForm
      url={ApiRoutes.UnitStateDetail}
      opsService={opsService}
      scheme={scheme}
      pageName={OpsPageNames.ProjectOperationManagement}
      title={t("Modal.UnitStateCreate")}
      editTitle={t("Modal.UnitStateDetail")}
      lastDisabledRowId={0}
      getAddExtraData={() => (opsModalData ? undefined : { projectId })}
      succesCallback={succesCallback}
    />
  );
}
