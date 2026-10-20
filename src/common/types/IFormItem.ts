import type { Breakpoint, GridSize } from "@mui/material";
import type { FieldValues, RegisterOptions, UseFormWatch } from "react-hook-form";
import type moment from "moment";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import { OpsFileTypeEnum } from "@common/enums/OpsFileTypeEnum";
import type { ILookupRequest } from "@common/types/ILookupRequest";

type ResponsiveStyleValue<T> = T | Array<T | null> | { [key in Breakpoint]?: T | null };

interface IAutoSelectItem {
  id: unknown;
  title: string;
}

export interface IAutoCompleteProps {
  enumName?: string;
  isMultiple?: boolean;
  lookUpParams?: ILookupRequest;
  requestedPropertyName?: string;
  getFilteredList?: (
    newOptions: IAutoSelectItem[],
    baseData: unknown[],
    isEdit?: boolean
  ) => IAutoSelectItem[] | null;
  getDefaultValue?: (apiData: unknown, isEdit?: boolean) => IAutoSelectItem | IAutoSelectItem[] | null;
  getOptions?: (
    setLoading: (loading: boolean) => void,
    setOptions: (values: unknown[]) => void,
    apiData?: unknown
  ) => void;
  getOptionDisabled?: (option: IAutoSelectItem) => boolean;
  onChangeBase?: (apiData: unknown, values: unknown) => void;
}

/**
 * Form şeması alanı — OpsForm/OpsPageForm'un tükettiği JSON şema birimi.
 *
 * Form dosyaları (`src/forms/*.tsx`) yalnızca `IFormItem[]` + callback döndürür;
 * JSX içermez (kodlama kuralı #2).
 */
export interface IFormItem {
  name: string;
  label: string;
  /**
   * Hazır çevrilmiş etiket; verilirse `label` yerine gösterilir ve t()'ye GİRMEZ.
   * Kullanıcının tanımladığı adlar (ör. projeye özel "Dükkan Alanı") için: bunlar i18n
   * anahtarı değil, t()'ye verilirse next-intl eksik anahtar diye patlar.
   */
  labelText?: string;
  placeholder?: string;
  type: FormItemTypeEnum;
  visibility: FormItemVisibilityEnum;
  infoText?: string;
  defaultValue?: unknown;
  onChange?: (data?: unknown, newValue?: unknown) => void;
  registerOptions?: RegisterOptions<FieldValues, string>;
  handleDisabled?: (isEdit?: boolean, data?: unknown) => boolean;
  inputDisabled?: (isEdit?: boolean, data?: unknown) => boolean;
  hanndleDisabledLabel?: (apiData: unknown) => string;
  options?: { value: unknown; label: React.ReactNode }[];
  minDate?: moment.Moment;
  maxDate?: moment.Moment;
  multiLine?: boolean;
  rows?: number;
  autoCompleteProps?: IAutoCompleteProps;
  gridSize?: ResponsiveStyleValue<GridSize>;
  getLabelText?: (values?: unknown, apiData?: unknown) => string;
  getLabelValue?: (values?: unknown, apiData?: unknown) => string;
  allowNegative?: boolean;
  fileType?: OpsFileTypeEnum;
  fileMultiple?: boolean;
  handleVisibility?: (apiData: unknown, watch?: UseFormWatch<FieldValues>) => boolean;
  icon?: React.ReactNode;
  triggerValue?: unknown;
}
