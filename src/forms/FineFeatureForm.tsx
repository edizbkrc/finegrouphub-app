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
 * Satılabilir Fine özelliği (sanal tur, render sayısı...). Programatik takma ad
 * ve tip yalnızca oluştururken belirlenir — teklif/sipariş akışı bunlara bağlı.
 */
export default function FineFeatureForm({ opsService }: { opsService: IOpsTableService<unknown> }) {
  const t = useTranslations();

  const scheme: IFormItem[] = [
    {
      name: "programmaticAlias",
      label: "ProgrammaticAlias",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      inputDisabled: (isEdit) => !!isEdit,
      gridSize: { xs: 12, md: 6 },
      registerOptions: {
        required: t("Form.Required"),
        pattern: { value: /^[a-z0-9-]+$/, message: t("Form.KebabCaseOnly") },
        maxLength: { value: 100, message: t("Form.MaxLength", { max: 100 }) },
      },
    },
    {
      name: "type",
      label: "FeatureType",
      type: FormItemTypeEnum.AUTO_COMPLETE,
      visibility: FormItemVisibilityEnum.Both,
      handleDisabled: (isEdit) => !!isEdit,
      gridSize: { xs: 12, md: 6 },
      registerOptions: { required: t("Form.Required") },
      autoCompleteProps: {
        enumName: "FeatureType",
        getDefaultValue: (apiData) => {
          const value = (apiData as { type?: number })?.type;
          return value ? { id: value, title: t(`FeatureType.${value}`) } : null;
        },
      },
    },
    {
      name: "name",
      label: "Name",
      type: FormItemTypeEnum.LANGUAGE_TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: { required: t("Form.Required"), maxLength: { value: 250, message: t("Form.MaxLength", { max: 250 }) } },
    },
    {
      name: "rowName",
      label: "RowName",
      type: FormItemTypeEnum.LANGUAGE_TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: { maxLength: { value: 250, message: t("Form.MaxLength", { max: 250 }) } },
    },
    {
      name: "description",
      label: "Description",
      type: FormItemTypeEnum.LANGUAGE_TEXT,
      visibility: FormItemVisibilityEnum.Both,
      multiLine: true,
      rows: 3,
      registerOptions: { maxLength: { value: 2000, message: t("Form.MaxLength", { max: 2000 }) } },
    },
    { name: "visibleOnPublicSite", label: "ViewInPublicSite", type: FormItemTypeEnum.SWITCH, visibility: FormItemVisibilityEnum.Both, gridSize: { xs: 12, md: 6 } },
    { name: "visibleOnOfferPreview", label: "VisibleOnOfferPreview", type: FormItemTypeEnum.SWITCH, visibility: FormItemVisibilityEnum.Both, gridSize: { xs: 12, md: 6 } },
    { name: "displayOrder", label: "Order", type: FormItemTypeEnum.NUMBER, visibility: FormItemVisibilityEnum.Both, defaultValue: 0, allowNegative: true, gridSize: { xs: 12, md: 6 } },
    {
      name: "unitPrices",
      label: "UnitPrices",
      type: FormItemTypeEnum.PRICE_RANGES,
      visibility: FormItemVisibilityEnum.Both,
      defaultValue: [{ id: "00000000-0000-0000-0000-000000000000", minRange: 0, maxRange: 9999, price: 0 }],
    },
  ];

  return (
    <OpsForm
      url={ApiRoutes.FeatureDetail}
      opsService={opsService}
      scheme={scheme}
      pageName={OpsPageNames.FeatureManagement}
      title={t("Modal.AddNewFeature")}
      editTitle={t("Modal.EditFeature")}
      lastDisabledRowId={0}
      // Takma ad ve tip güncellenemez (komut desteklemiyor).
      getDeletedPropertyNames={(_, apiData) => (apiData ? ["programmaticAlias", "type"] : [])}
    />
  );
}

