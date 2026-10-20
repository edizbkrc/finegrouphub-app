import type { ReactNode } from "react";
import type { IFormItem } from "./IFormItem";
import type { ILanguageDto } from "./ILanguageDto";
import type { IOpsFormSharedProps } from "./IOpsFormSharedProps";
import type { IReactHookFormProps } from "./IReactHookFormProps";

export interface IOpsFormGeneratorProps extends IOpsFormSharedProps {
  schema: IFormItem[];
  submitLoading?: boolean;
  onSubmit: (data: any) => void;
  apiData?: any;
  isEdit?: boolean;
  submitButtonVisible?: boolean;
  languages: ILanguageDto[];
  handleClose?: () => void;
  /** Form alanlarından önce (Kaydet dirty takibi için setValue erişimi). */
  renderBefore?: (apiData: any, formState: IReactHookFormProps) => ReactNode;
  renderExtra?: (apiData: any, formState: IReactHookFormProps) => ReactNode;
}
