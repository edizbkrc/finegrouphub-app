import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormItem } from "@common/types/IFormItem";
import type { IResolvedUnitAreaFields, UnitAreaFieldKey } from "@features/project/unitAreaFields";
import { lookup, navigationDefault } from "../helpers/formHelpers";

/**
 * Mülk şablonu form şeması.
 *
 * Ayrı dosyada: hem `UnitTemplateForm` hem de Excel toplu ekleme aynı şemayı
 * okur, böylece forma alan eklendiğinde Excel şablonu da kendiliğinden değişir.
 */
export type Translate = (key: string, values?: Record<string, string | number | Date>) => string;

export const buildUnitTemplateScheme = (t: Translate, areaFields?: IResolvedUnitAreaFields): IFormItem[] => {
  // areaFields yoksa (proje config'i null ya da çağıran vermedi) bugünkü sabit üç alan aynen kalır.
  const area = (name: UnitAreaFieldKey, label: string): IFormItem[] => {
    const resolved = areaFields?.[name];
    // Gizli alan şemaya hiç girmez: ne formda sorulur ne Excel'de kolon açılır. Create'te
    // değer 0 olarak extraData'dan gider (hiddenAreaZeros), update'te gönderilmez.
    if (resolved?.hidden) return [];
    return [
      {
        name,
        label,
        // Projeye özel ad; placeholder da verilmeli, yoksa NumericInput varsayılan adı yazar.
        ...(resolved && {
          labelText: resolved.label,
          placeholder: t("Form.PlaceHolderValue", { value: resolved.label }),
        }),
        type: FormItemTypeEnum.Decimal,
        visibility: FormItemVisibilityEnum.Both,
        gridSize: { xs: 12, md: 4 },
        registerOptions: { required: t("Form.Required") },
      },
    ];
  };

  return [
    {
      name: "name",
      label: "Name",
      type: FormItemTypeEnum.LANGUAGE_TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: {
        required: t("Form.Required"),
        maxLength: { value: 100, message: t("Form.MaxLength", { max: 100 }) },
      },
    },
    {
      name: "unitTypeId",
      label: "UnitType",
      type: FormItemTypeEnum.AUTO_COMPLETE,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: { required: t("Form.Required") },
      autoCompleteProps: { lookUpParams: lookup("UnitType"), getDefaultValue: navigationDefault("unitType") },
    },
    ...area("grossArea", "GrossArea"),
    ...area("netArea", "NetArea"),
    ...area("indoorArea", "IndoorArea"),
  ];
};
