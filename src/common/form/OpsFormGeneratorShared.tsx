import type { ComponentType, ReactNode } from "react";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import type { ICommonInputProps } from "@common/types/ICommonInputProps";
import type { ILanguageDto } from "@common/types/ILanguageDto";
// ⚠️ `../inputs` (barrel) DEĞİL: package.json'da `sideEffects` alanı yok, yani
// webpack barrel'ı tree-shake edemiyor ve `../inputs`'tan TEK bir named
// import bile barrel'ın re-export ettiği HER modülü (dolayısıyla
// MuiIconAutocomplete'in `import * as MuiIcons from "@mui/icons-material"`
// namespace import'unu — tüm ikon paketi, ~13.000 modül) pakete gömüyordu.
// Ölçüldü: bu formu (hiç MUI_ICON_AUTOCOMPLETE alanı içermeyen) kullanan
// `/users/user` sayfasında ~1.6 MB fazladan First Load JS. Her input kendi
// dosya yolundan içe aktarılır; MuiIconAutocomplete ayrıca (çağıran tarafta)
// `next/dynamic()` ile kod bölünür (bkz. OpsFormGenerator/OpsPageFormGenerator).
import AutoSelect from "../inputs/AutoSelect";
import CheckboxInput from "../inputs/CheckboxInput";
import ColorPickerInput from "../inputs/ColorPickerInput";
import DateInput from "../inputs/DateInput";
import DateTimeInput from "../inputs/DateTimeInput";
import ImageUpload from "../inputs/ImageUpload";
import MultiArrayObjectInput from "../inputs/MultiArrayObjectInput";
import MultiLangInput from "../inputs/MultiLangInput";
import NumericInput from "../inputs/NumericInput";
import PriceRangesInput from "../inputs/PriceRangesInput";
import FeatureSpecificationsInput from "../inputs/FeatureSpecificationsInput";
import RadioInput from "../inputs/RadioInput";
import SwitchInput from "../inputs/SwitchInput";
import TextInput from "../inputs/TextInput";

export type FieldRenderer = (props: ICommonInputProps) => ReactNode;

/** `path.split(".")` ile iç içe (`address.city` gibi) değerleri okur. */
export const getNestedValue = (obj: any, path: string) => path.split(".").reduce((acc, key) => acc?.[key], obj);

interface IDynamicInputs {
  OpsEditor: ComponentType<any>;
  LabelFields: ComponentType<any>;
  TelInput: ComponentType<any>;
  FileInput: ComponentType<any>;
  MultiLangArrayInput: ComponentType<any>;
  MultiLangFileInput: ComponentType<any>;
  MultiArrayTextInput: ComponentType<any>;
  MultiLangEditor: ComponentType<any>;
  /**
   * `../inputs/MuiIconAutocomplete` `* as MuiIcons from "@mui/icons-material"`
   * (tüm ikon setinin barrel import'u) içeriyor. Burada statik import
   * edilseydi, MUI_ICON_AUTOCOMPLETE hiç kullanmayan bir form bile (örn.
   * UserForm) onu ilk yük paketine gömerdi — `/users/user` sayfasında ölçüldü:
   * ~1.6 MB fazladan First Load JS. Diğer ağır input'larla aynı desende
   * `next/dynamic()` ile çağıran taraftan enjekte edilir.
   */
  MuiIconAutocomplete: ComponentType<any>;
}

interface IBuildFieldRenderersArgs extends IDynamicInputs {
  languages: ILanguageDto[];
  selectedLang: string;
  handleLanguageChange: (e: { target: { value: string } }) => void;
  watch: (...args: any[]) => any;
}

/**
 * OpsFormGenerator (modal) ve OpsPageFormGenerator (tam sayfa) TAMAMEN AYNI
 * tip → bileşen eşlemesini kullanıyordu; iki dosyada birebir kopyalanmıştı.
 * Tek kaynak burası.
 */
export function buildFieldRenderers({
  languages,
  selectedLang,
  handleLanguageChange,
  watch,
  OpsEditor,
  LabelFields,
  TelInput,
  FileInput,
  MultiLangArrayInput,
  MultiLangFileInput,
  MultiArrayTextInput,
  MultiLangEditor,
  MuiIconAutocomplete,
}: IBuildFieldRenderersArgs): Map<FormItemTypeEnum, FieldRenderer> {
  const withLangProps = (Component: ComponentType<any>): FieldRenderer => {
    const LangRenderer = (fieldProps: ICommonInputProps) => (
      <Component {...fieldProps} languages={languages} selectedLang={selectedLang} handleLanguageChange={handleLanguageChange} />
    );
    LangRenderer.displayName = `WithLang(${Component.displayName || Component.name || "Input"})`;
    return LangRenderer;
  };

  const withWatch = (Component: ComponentType<any>): FieldRenderer => {
    const WatchRenderer = (fieldProps: ICommonInputProps) => <Component {...fieldProps} watch={watch} />;
    WatchRenderer.displayName = `WithWatch(${Component.displayName || Component.name || "Input"})`;
    return WatchRenderer;
  };

  const asRenderer = (Component: ComponentType<any>): FieldRenderer => {
    const PlainRenderer = (fieldProps: ICommonInputProps) => <Component {...fieldProps} />;
    PlainRenderer.displayName = `AsRenderer(${Component.displayName || Component.name || "Input"})`;
    return PlainRenderer;
  };

  const renderers: Map<FormItemTypeEnum, FieldRenderer> = new Map();
  renderers.set(FormItemTypeEnum.TEXT, TextInput);
  renderers.set(FormItemTypeEnum.Password, TextInput);
  renderers.set(FormItemTypeEnum.EMAIL, TextInput);
  renderers.set(FormItemTypeEnum.NUMBER, NumericInput);
  renderers.set(FormItemTypeEnum.Decimal, NumericInput);
  renderers.set(FormItemTypeEnum.DATE, DateInput);
  renderers.set(FormItemTypeEnum.Date_Time, DateTimeInput);
  renderers.set(FormItemTypeEnum.CHECKBOX, CheckboxInput);
  renderers.set(FormItemTypeEnum.SWITCH, SwitchInput);
  renderers.set(FormItemTypeEnum.PHONE, asRenderer(TelInput));
  renderers.set(FormItemTypeEnum.RADIO, RadioInput);
  renderers.set(FormItemTypeEnum.AUTO_COMPLETE, AutoSelect);
  renderers.set(FormItemTypeEnum.MUI_ICON_AUTOCOMPLETE, asRenderer(MuiIconAutocomplete));
  renderers.set(FormItemTypeEnum.Image, ImageUpload);
  renderers.set(FormItemTypeEnum.S3_IMAGE, ImageUpload);
  renderers.set(FormItemTypeEnum.FILE, asRenderer(FileInput));
  renderers.set(FormItemTypeEnum.Editor, asRenderer(OpsEditor));
  renderers.set(FormItemTypeEnum.Label_Fields, withWatch(LabelFields));
  renderers.set(FormItemTypeEnum.LANGUAGE_TEXT, withLangProps(MultiLangInput));
  renderers.set(FormItemTypeEnum.LANGUAGE_ARRAY_TEXT, withLangProps(MultiLangArrayInput));
  renderers.set(FormItemTypeEnum.LANGUAGE_FILE, withLangProps(MultiLangFileInput));
  renderers.set(FormItemTypeEnum.LANGUAGE_EDITOR, withLangProps(MultiLangEditor));
  renderers.set(FormItemTypeEnum.MultiArrayTextInput, withWatch(MultiArrayTextInput));
  renderers.set(FormItemTypeEnum.MultiArrayObjectInput, withWatch(MultiArrayObjectInput));
  renderers.set(FormItemTypeEnum.COLOR_PICKER, ColorPickerInput);
  renderers.set(FormItemTypeEnum.PRICE_RANGES, PriceRangesInput);
  renderers.set(FormItemTypeEnum.FEATURE_SPECIFICATIONS, FeatureSpecificationsInput);

  return renderers;
}
